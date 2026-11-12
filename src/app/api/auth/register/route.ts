import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { hashPassword } from "@/lib/passwords";
import { validateStrongPassword } from "@/lib/password-policy";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { notifyRequestReviewers } from "@/lib/request-notifications";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function resultRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (typeof result === "object" && result !== null && "rows" in result && Array.isArray(result.rows)) {
    return result.rows as T[];
  }
  return [];
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = checkRateLimit("self-register:" + ip, 5, 15 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json(
      { message: "محاولات تسجيل كثيرة. يرجى الانتظار 15 دقيقة والمحاولة مرة أخرى." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  try {
    const body = await request.json();
    const fullName = String(body.fullNameAr || body.fullName || body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const nationalId = body.nationalId ? String(body.nationalId).trim() : null;
    const password = String(body.password || "");
    const branchId = body.branchId ? String(body.branchId).trim() : null;

    if (!fullName || fullName.length < 3) {
      return NextResponse.json({ message: "يرجى إدخال الاسم بالكامل بشكل صحيح." }, { status: 400 });
    }
    if (!/^01[0125][0-9]{8}$/.test(phone)) {
      return NextResponse.json({ message: "يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقماً." }, { status: 400 });
    }
    if (nationalId && !/^[23][0-9]{13}$/.test(nationalId)) {
      return NextResponse.json({ message: "الرقم القومي يجب أن يتكون من 14 رقماً صحيحاً." }, { status: 400 });
    }

    const pwCheck = validateStrongPassword(password);
    if (!pwCheck.valid) {
      return NextResponse.json({ message: pwCheck.message }, { status: 400 });
    }

    const existing = await db.execute(sql`SELECT id, is_active FROM users WHERE phone = ${phone} LIMIT 1;`);
    const existingRows = resultRows<{ id: string; is_active: boolean }>(existing);
    if (existingRows.length > 0) {
      const msg = existingRows[0].is_active
        ? "رقم الهاتف مسجل ومفعّل بالفعل. يمكنك تسجيل الدخول مباشرة."
        : "تم تسجيل بيانات هذا الرقم مسبقاً وهو قيد المراجعة والتفعيل من قِبل الإدارة.";
      return NextResponse.json({ message: msg }, { status: 409 });
    }

    const countRes = await db.execute(sql`SELECT (COUNT(*)::int + 1) AS next_num FROM users;`);
    const nextNum = resultRows<{ next_num: number }>(countRes)[0]?.next_num || 1;
    const empCode = String(nextNum).padStart(3, "0");
    const hashedPassword = await hashPassword(password);
    const newId = randomUUID();

    // Account is created with is_active = FALSE until approved by HR / System Admin
    await db.execute(sql`
      INSERT INTO users (
        id, full_name_ar, phone, national_id, password_hash,
        employee_number, employee_code, primary_branch_id,
        job_role, system_role, monthly_salary, working_hours_per_day,
        is_active, shift_start_time, shift_end_time, shift_name,
        created_at, updated_at
      ) VALUES (
        ${newId}, ${fullName}, ${phone}, ${nationalId}, ${hashedPassword},
        ${empCode}, ${empCode}, ${branchId},
        'موظف (قيد المراجعة)', 'EMPLOYEE', 0, 8,
        false, '10:00', '18:00', 'الشيفت الصباحي',
        NOW(), NOW()
      );
    `);

    try {
      await notifyRequestReviewers(
        newId,
        "تسجيل بيانات موظف جديد (بانتظار التفعيل)",
        `قام (${fullName} - ${phone}) بتسجيل بياناته. يرجى مراجعة الحساب وتحديد الفرع والصلاحيات وتفعيله.`,
        "/admin/employees",
        "STAFF_REQUEST",
        branchId
      );
    } catch {}

    return NextResponse.json({
      success: true,
      pendingApproval: true,
      message: "تم تسجيل بياناتك بنجاح! حسابك الآن قيد المراجعة لدى إدارة الموارد البشرية (HR) ومدير النظام لتحديد الصلاحيات وتفعيل الحساب.",
    }, { status: 201 });
  } catch (error) {
    console.error("Self-registration error:", error);
    return NextResponse.json({ message: "حدث خطأ أثناء تسجيل البيانات." }, { status: 500 });
  }
}