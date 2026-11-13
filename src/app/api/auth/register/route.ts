import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getSqlRows } from "@/lib/db";
import { hashPassword } from "@/lib/passwords";
import { validateStrongPassword } from "@/lib/password-policy";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { notifyRequestReviewers } from "@/lib/request-notifications";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ColInfo extends Record<string, unknown> {
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: string;
  column_default: string | null;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRateLimit("self-register:" + ip, 15, 15 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json(
      { message: "محاولات تسجيل كثيرة. يرجى الانتظار دقائق والمحاولة مرة أخرى." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const fullName = String(body.fullNameAr || body.fullName || body.name || "").trim();
    const rawPhone = String(body.phone || "").trim();
    const phone = rawPhone
      .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
      .replace(/\s+/g, "");
    const password = String(body.password || "");

    if (!fullName || fullName.length < 3) {
      return NextResponse.json({ message: "يرجى إدخال الاسم رباعياً بشكل صحيح." }, { status: 400 });
    }
    if (!/^01[0125][0-9]{8}$/.test(phone)) {
      return NextResponse.json({ message: "يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقماً." }, { status: 400 });
    }

    const pwCheck = validateStrongPassword(password);
    if (!pwCheck.valid) {
      return NextResponse.json({ message: pwCheck.message }, { status: 400 });
    }

    // Ensure full_name_ar and password_hash exist
    try { await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name_ar text;`); } catch {}
    try { await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;`); } catch {}
    try { await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT false;`); } catch {}
    try { await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS job_role text DEFAULT 'موظف';`); } catch {}
    try { await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_number text;`); } catch {}
    try { await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_code text;`); } catch {}

    // Check duplicate phone
    const existingRows = getSqlRows<{ id: string; is_active: boolean }>(
      await db.execute(sql`SELECT id::text AS id, COALESCE(is_active, true) AS is_active FROM users WHERE BTRIM(phone) = ${phone} LIMIT 1;`)
    );
    if (existingRows.length > 0) {
      const msg = existingRows[0].is_active
        ? "رقم الهاتف مسجل ومفعّل بالفعل. يمكنك تسجيل الدخول مباشرة."
        : "تم تسجيل بيانات هذا الرقم مسبقاً وهو قيد المراجعة والتفعيل من الإدارة.";
      return NextResponse.json({ message: msg }, { status: 409 });
    }

    // Inspect actual columns of users table in Neon DB
    const colRows = getSqlRows<ColInfo>(
      await db.execute(sql`
        SELECT column_name, data_type, udt_name, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users';
      `)
    );
    const colMap = new Map<string, ColInfo>();
    for (const c of colRows) colMap.set(c.column_name, c);

    // Relax any NOT NULL constraints on optional columns dynamically
    for (const c of colRows) {
      if (
        c.column_name !== "id" &&
        c.column_name !== "phone" &&
        c.is_nullable === "NO" &&
        !c.column_default
      ) {
        try {
          await db.execute(sql.raw(`ALTER TABLE users ALTER COLUMN "${c.column_name}" DROP NOT NULL;`));
        } catch {}
      }
    }

    const countRows = getSqlRows<{ total: number }>(
      await db.execute(sql`SELECT COUNT(*)::int AS total FROM users;`)
    );
    const nextNum = (countRows[0]?.total || 0) + 1;
    const empCode = String(nextNum).padStart(3, "0") + "-" + String(Date.now()).slice(-3);
    const hashedPassword = await hashPassword(password);

    // Build dynamic column/value list matching exact Neon DB schema
    const insertCols: string[] = [];
    const insertVals: ReturnType<typeof sql>[] = [];

    const addCol = (colName: string, val: ReturnType<typeof sql>) => {
      if (colMap.has(colName)) {
        insertCols.push(`"${colName}"`);
        insertVals.push(val);
      }
    };

    const idCol = colMap.get("id");
    const isNumericId = idCol && (idCol.data_type.includes("int") || idCol.udt_name.includes("int"));
    const hasDefaultId = idCol && Boolean(idCol.column_default);

    if (!isNumericId && !hasDefaultId) {
      addCol("id", sql`${randomUUID()}`);
    }

    addCol("full_name_ar", sql`${fullName}`);
    addCol("full_name_en", sql`${fullName}`);
    addCol("name", sql`${fullName}`);
    addCol("full_name", sql`${fullName}`);
    addCol("phone", sql`${phone}`);
    addCol("password_hash", sql`${hashedPassword}`);
    addCol("password", sql`${hashedPassword}`);
    addCol("employee_number", sql`${empCode}`);
    addCol("employee_code", sql`${empCode}`);
    addCol("job_role", sql`'موظف (قيد المراجعة)'`);
    addCol("role", sql`'EMPLOYEE'`);
    addCol("monthly_salary", sql`0`);
    addCol("working_hours_per_day", sql`8`);
    addCol("is_active", sql`false`);

    const colsSql = sql.raw(insertCols.join(", "));
    const valsSql = sql.join(insertVals, sql`, `);

    const inserted = getSqlRows<{ id: string }>(
      await db.execute(sql`
        INSERT INTO users (${colsSql})
        VALUES (${valsSql})
        RETURNING id::text AS id;
      `)
    );

    const newId = inserted[0]?.id || "";

    try {
      await notifyRequestReviewers(
        newId,
        "تسجيل بيانات موظف جديد (بانتظار التفعيل)",
        `قام (${fullName} - ${phone}) بتسجيل بياناته. يرجى مراجعة الحساب وتحديد الفرع والصلاحيات وتفعيله.`,
        "/admin/employees",
        "STAFF_REQUEST",
        null
      );
    } catch {}

    return NextResponse.json({
      success: true,
      pendingApproval: true,
      message: "تم تسجيل بياناتك بنجاح! حسابك الآن قيد المراجعة لدى الإدارة لتحديد الصلاحيات وتفعيل الحساب.",
    }, { status: 201 });
  } catch (error) {
    console.error("Self-registration error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "حدث خطأ أثناء تسجيل البيانات." },
      { status: 500 }
    );
  }
}
