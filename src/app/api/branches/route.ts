import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getSqlRows } from "@/lib/db";
import { authorizeApi } from "@/lib/api-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ColInfo extends Record<string, unknown> {
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: string;
  column_default: string | null;
}

async function getBranchColumns() {
  const stmts = [
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS name text`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS name_ar text`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS name_en text`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS address text`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS phone text`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS manager_id text`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS geofence_radius integer DEFAULT 10`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS radius_meters integer DEFAULT 10`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS grace_period_minutes integer DEFAULT 15`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS shift1_start text DEFAULT '10:00'`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS shift1_end text DEFAULT '18:00'`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS shift2_start text DEFAULT '13:00'`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS shift2_end text DEFAULT '21:00'`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS shift3_start text DEFAULT '17:00'`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS shift3_end text DEFAULT '01:00'`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS qr_secret_key text`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`,
  ];
  for (const s of stmts) {
    try { await db.execute(s); } catch {}
  }

  const rows = getSqlRows(
    await db.execute(sql`
      SELECT column_name, data_type, udt_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'branches';
    `)
  );
  const map = new Map();
  for (const r of rows) {
    map.set(r.column_name, r);
    if (r.column_name !== "id" && r.is_nullable === "NO" && !r.column_default) {
      try {
        await db.execute(sql.raw('ALTER TABLE branches ALTER COLUMN "' + r.column_name + '" DROP NOT NULL;'));
      } catch {}
    }
  }
  return map;
}

export async function GET() {
  try {
    await getBranchColumns();
    const rows = getSqlRows(
      await db.execute(sql`
        SELECT
          id::text AS id,
          COALESCE(name_ar, name, 'فرع') AS "nameAr",
          COALESCE(name_ar, name, 'فرع') AS "name_ar",
          COALESCE(name_ar, name, 'فرع') AS "name",
          COALESCE(name_en, name_ar, name, 'Branch') AS "nameEn",
          COALESCE(name_en, name_ar, name, 'Branch') AS "name_en",
          COALESCE(address, '') AS "address",
          COALESCE(phone, '') AS "phone",
          manager_id::text AS "managerId",
          COALESCE(latitude::float8, 31.12225) AS "latitude",
          COALESCE(longitude::float8, 30.64821) AS "longitude",
          COALESCE(geofence_radius, radius_meters, 10) AS "geofenceRadius",
          COALESCE(geofence_radius, radius_meters, 10) AS "geofence_radius",
          COALESCE(geofence_radius, radius_meters, 10) AS "radiusMeters",
          COALESCE(grace_period_minutes, 15) AS "gracePeriodMinutes",
          COALESCE(shift1_start, '10:00') AS "shift1Start",
          COALESCE(shift1_end, '18:00') AS "shift1End",
          COALESCE(shift2_start, '13:00') AS "shift2Start",
          COALESCE(shift2_end, '21:00') AS "shift2End",
          COALESCE(shift3_start, '17:00') AS "shift3Start",
          COALESCE(shift3_end, '01:00') AS "shift3End",
          COALESCE(is_active, true) AS "isActive"
        FROM branches
        ORDER BY id ASC;
      `)
    );

    // Check if logged-in user has restricted branch scope
    const auth = await authorizeApi();
    if ("principal" in auth && auth.principal) {
      const p = auth.principal;
      if (p.systemRole !== "SUPER_ADMIN" && p.jobRole !== "مدير النظام" && p.branchScope !== "ALL") {
        const scoped = rows.filter((b: Record<string, unknown>) => {
          const bid = String(b.id || "");
          if (p.branchScope === "CUSTOM" && p.allowedBranchIds.length > 0) {
            return p.allowedBranchIds.includes(bid);
          }
          if (p.primaryBranchId) {
            return bid === String(p.primaryBranchId);
          }
          return true;
        });
        if (scoped.length > 0) {
          return NextResponse.json(scoped, { status: 200 });
        }
      }
    }

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Branches GET error:", error);
    return NextResponse.json({ message: "تعذر جلب الفروع" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeApi("branches.manage");
    if ("response" in auth) return auth.response;

    const colMap = await getBranchColumns();
    const body = await request.json();

    const id = body.id ? String(body.id).trim() : null;
    const nameAr = String(body.nameAr || body.name_ar || body.name || "").trim();
    const nameEn = String(body.nameEn || body.name_en || nameAr || "Branch").trim();
    const address = body.address ? String(body.address).trim() : null;
    const phone = body.phone ? String(body.phone).trim() : null;
    const managerId = body.managerId && String(body.managerId).trim() !== "" ? String(body.managerId).trim() : null;
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    const geofenceRadius = Math.max(1, parseInt(String(body.geofenceRadius ?? body.geofence_radius ?? body.radiusMeters ?? 10), 10) || 10);
    const gracePeriodMinutes = parseInt(String(body.gracePeriodMinutes ?? body.grace_period_minutes ?? 15), 10) || 15;
    const shift1Start = String(body.shift1Start || body.shift1_start || "10:00").trim();
    const shift1End = String(body.shift1End || body.shift1_end || "18:00").trim();
    const shift2Start = String(body.shift2Start || body.shift2_start || "13:00").trim();
    const shift2End = String(body.shift2End || body.shift2_end || "21:00").trim();
    const shift3Start = String(body.shift3Start || body.shift3_start || "17:00").trim();
    const shift3End = String(body.shift3End || body.shift3_end || "01:00").trim();

    if (!nameAr) {
      return NextResponse.json({ message: "يرجى إدخال اسم الفرع بالعربي" }, { status: 400 });
    }
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return NextResponse.json({ message: "يرجى تحديد إحداثيات الموقع للفرع" }, { status: 400 });
    }

    if (id) {
      const updates: any[] = [];
      const setCol = (colName: string, val: any) => {
        if (colMap.has(colName)) {
          updates.push(sql`${sql.raw('"' + colName + '"')} = ${val}`);
        }
      };
      setCol("name", sql`${nameAr}`);
      setCol("name_ar", sql`${nameAr}`);
      setCol("name_en", sql`${nameEn}`);
      setCol("address", sql`${address}`);
      setCol("phone", sql`${phone}`);
      setCol("latitude", sql`${latitude}`);
      setCol("longitude", sql`${longitude}`);
      setCol("geofence_radius", sql`${geofenceRadius}`);
      setCol("radius_meters", sql`${geofenceRadius}`);
      setCol("grace_period_minutes", sql`${gracePeriodMinutes}`);
      setCol("shift1_start", sql`${shift1Start}`);
      setCol("shift1_end", sql`${shift1End}`);
      setCol("shift2_start", sql`${shift2Start}`);
      setCol("shift2_end", sql`${shift2End}`);
      setCol("shift3_start", sql`${shift3Start}`);
      setCol("shift3_end", sql`${shift3End}`);

      await db.execute(sql`
        UPDATE branches
        SET ${sql.join(updates, sql`, `)}
        WHERE id::text = ${id};
      `);

      if (managerId) {
        try {
          await db.execute(sql`UPDATE branches SET manager_id = ${managerId} WHERE id::text = ${id};`);
        } catch {}
      }

      return NextResponse.json({ success: true, id, message: "تم تحديث الفرع بنجاح" });
    } else {
      const insertCols: string[] = [];
      const insertVals: any[] = [];
      const addCol = (colName: string, val: any) => {
        if (colMap.has(colName)) {
          insertCols.push('"' + colName + '"');
          insertVals.push(val);
        }
      };

      const idCol = colMap.get("id");
      const isNumericId = idCol && (idCol.data_type.includes("int") || idCol.udt_name.includes("int"));
      const hasDefaultId = idCol && Boolean(idCol.column_default);

      if (!isNumericId && !hasDefaultId) {
        addCol("id", sql`${randomUUID()}`);
      }

      addCol("name", sql`${nameAr}`);
      addCol("name_ar", sql`${nameAr}`);
      addCol("name_en", sql`${nameEn}`);
      addCol("address", sql`${address}`);
      addCol("phone", sql`${phone}`);
      addCol("latitude", sql`${latitude}`);
      addCol("longitude", sql`${longitude}`);
      addCol("geofence_radius", sql`${geofenceRadius}`);
      addCol("radius_meters", sql`${geofenceRadius}`);
      addCol("grace_period_minutes", sql`${gracePeriodMinutes}`);
      addCol("shift1_start", sql`${shift1Start}`);
      addCol("shift1_end", sql`${shift1End}`);
      addCol("shift2_start", sql`${shift2Start}`);
      addCol("shift2_end", sql`${shift2End}`);
      addCol("shift3_start", sql`${shift3Start}`);
      addCol("shift3_end", sql`${shift3End}`);
      addCol("qr_secret_key", sql`${randomUUID().replace(/-/g, "")}`);
      addCol("is_active", sql`true`);

      const inserted = getSqlRows(
        await db.execute(sql`
          INSERT INTO branches (${sql.raw(insertCols.join(", "))})
          VALUES (${sql.join(insertVals, sql`, `)})
          RETURNING id::text AS id;
        `)
      );

      const newBranchId = inserted[0]?.id || "";
      if (managerId && newBranchId) {
        try {
          await db.execute(sql`UPDATE branches SET manager_id = ${managerId} WHERE id::text = ${newBranchId};`);
        } catch {}
      }

      return NextResponse.json({ success: true, id: newBranchId, message: "تم إضافة الفرع بنجاح" }, { status: 201 });
    }
  } catch (error) {
    console.error("Branches POST error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? "تعذر حفظ بيانات الفرع: " + error.message : "تعذر حفظ بيانات الفرع" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authorizeApi("branches.manage");
    if ("response" in auth) return auth.response;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "معرف الفرع مطلوب" }, { status: 400 });

    await db.execute(sql`UPDATE users SET primary_branch_id = NULL WHERE primary_branch_id::text = ${id};`);
    await db.execute(sql`DELETE FROM branches WHERE id::text = ${id};`);
    return NextResponse.json({ success: true, message: "تم حذف الفرع بنجاح" });
  } catch (error) {
    console.error("Branches DELETE error:", error);
    return NextResponse.json({ message: "تعذر حذف الفرع" }, { status: 500 });
  }
}
