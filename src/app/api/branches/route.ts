import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getSqlRows } from "@/lib/db";
import { authorizeApi } from "@/lib/api-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

let branchesReady = false;
async function ensureBranchesReady() {
  if (branchesReady) return;
  const stmts = [
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS name text`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS name_ar text`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS name_en text`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS address text`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS phone text`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS manager_id text`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS geofence_radius integer DEFAULT 10`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS grace_period_minutes integer DEFAULT 15`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS shift1_start text DEFAULT '10:00'`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS shift1_end text DEFAULT '18:00'`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS shift2_start text DEFAULT '13:00'`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS shift2_end text DEFAULT '21:00'`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS shift3_start text DEFAULT '17:00'`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS shift3_end text DEFAULT '01:00'`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS qr_secret_key text DEFAULT 'lk-secret'`,
    sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`,
    sql`ALTER TABLE branches ALTER COLUMN qr_secret_key DROP NOT NULL`,
    sql`ALTER TABLE branches ALTER COLUMN name_en DROP NOT NULL`,
  ];
  for (const s of stmts) {
    try { await db.execute(s); } catch {}
  }
  branchesReady = true;
}

export async function GET() {
  try {
    await ensureBranchesReady();
    const rows = getSqlRows<Record<string, unknown>>(
      await db.execute(sql`
        SELECT
          id::text AS id,
          COALESCE(name_ar, 'فرع') AS "nameAr",
          COALESCE(name_ar, 'فرع') AS "name_ar",
          COALESCE(name_ar, 'فرع') AS "name",
          COALESCE(name_en, name_ar, 'Branch') AS "nameEn",
          COALESCE(name_en, name_ar, 'Branch') AS "name_en",
          COALESCE(address, '') AS "address",
          COALESCE(phone, '') AS "phone",
          manager_id::text AS "managerId",
          COALESCE(latitude::float8, 31.12225) AS "latitude",
          COALESCE(longitude::float8, 30.64821) AS "longitude",
          COALESCE(geofence_radius, 10) AS "geofenceRadius",
          COALESCE(geofence_radius, 10) AS "geofence_radius",
          COALESCE(geofence_radius, 10) AS "radiusMeters",
          COALESCE(grace_period_minutes, 15) AS "gracePeriodMinutes",
          COALESCE(shift1_start, '10:00') AS "shift1Start",
          COALESCE(shift1_end, '18:00') AS "shift1End",
          COALESCE(shift2_start, '13:00') AS "shift2Start",
          COALESCE(shift2_end, '21:00') AS "shift2End",
          COALESCE(shift3_start, '17:00') AS "shift3Start",
          COALESCE(shift3_end, '01:00') AS "shift3End",
          COALESCE(is_active, true) AS "isActive"
        FROM branches
        ORDER BY created_at ASC;
      `)
    );
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error("Branches GET error:", error);
    return NextResponse.json({ message: "تعذر جلب الفروع" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeApi(["branches.manage", "branches.view"]);
    if ("response" in auth) return auth.response;
    await ensureBranchesReady();

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

    if (!nameAr || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return NextResponse.json({ message: "اسم الفرع وإحداثيات الموقع مطلوبة" }, { status: 400 });
    }

    if (id) {
      await db.execute(sql`
        UPDATE branches
        SET
          name_ar = ${nameAr},
          name_en = ${nameEn},
          address = ${address},
          latitude = ${latitude},
          longitude = ${longitude},
          geofence_radius = ${geofenceRadius}
        WHERE id::text = ${id};
      `);
      try {
        await db.execute(sql`
          UPDATE branches
          SET
            name = ${nameAr},
            phone = ${phone},
            manager_id = ${managerId},
            grace_period_minutes = ${gracePeriodMinutes},
            shift1_start = ${shift1Start},
            shift1_end = ${shift1End},
            shift2_start = ${shift2Start},
            shift2_end = ${shift2End},
            shift3_start = ${shift3Start},
            shift3_end = ${shift3End}
          WHERE id::text = ${id};
        `);
      } catch {}
      return NextResponse.json({ success: true, id, message: "تم تحديث الفرع بنجاح" });
    } else {
      const qrSecret = randomUUID().replace(/-/g, "");
      let insertedId = "";

      // Try inserting without explicit id first (works when id is SERIAL or has DEFAULT gen_random_uuid())
      try {
        const res = getSqlRows<{ id: string }>(
          await db.execute(sql`
            INSERT INTO branches (
              name_ar, name_en, address, latitude, longitude, geofence_radius, qr_secret_key, is_active
            ) VALUES (
              ${nameAr}, ${nameEn}, ${address}, ${latitude}, ${longitude}, ${geofenceRadius}, ${qrSecret}, true
            ) RETURNING id::text AS id;
          `)
        );
        insertedId = res[0]?.id || "";
      } catch {
        // Fallback if id column has no default
        const newUuid = randomUUID();
        await db.execute(sql`
          INSERT INTO branches (
            id, name_ar, name_en, address, latitude, longitude, geofence_radius, qr_secret_key, is_active
          ) VALUES (
            ${newUuid}, ${nameAr}, ${nameEn}, ${address}, ${latitude}, ${longitude}, ${geofenceRadius}, ${qrSecret}, true
          );
        `);
        insertedId = newUuid;
      }

      if (insertedId) {
        try {
          await db.execute(sql`
            UPDATE branches
            SET
              name = ${nameAr},
              phone = ${phone},
              manager_id = ${managerId},
              grace_period_minutes = ${gracePeriodMinutes},
              shift1_start = ${shift1Start},
              shift1_end = ${shift1End},
              shift2_start = ${shift2Start},
              shift2_end = ${shift2End},
              shift3_start = ${shift3Start},
              shift3_end = ${shift3End}
            WHERE id::text = ${insertedId};
          `);
        } catch {}
      }

      return NextResponse.json({ success: true, id: insertedId, message: "تم إضافة الفرع بنجاح" }, { status: 201 });
    }
  } catch (error) {
    console.error("Branches POST error:", error);
    return NextResponse.json({ message: "تعذر حفظ بيانات الفرع" }, { status: 500 });
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
