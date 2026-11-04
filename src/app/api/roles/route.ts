import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// 1. استرجاع قائمة الأدوار
export async function GET() {
  try {
    // محاولة الاستعلام من جدول custom_roles المعتمد في Schema النظام
    const raw = await db.execute(sql`
      SELECT 
        id, 
        name, 
        name_ar as "nameAr", 
        permissions, 
        is_system as "isSystem",
        created_at as "createdAt"
      FROM custom_roles 
      ORDER BY id ASC;
    `);

    const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    return NextResponse.json(rows, { status: 200 });
  } catch {
    // محاولة احتياطية من جدول roles في حال وجوده
    try {
      const fallback = await db.execute(sql`
        SELECT 
          id, 
          name, 
          name_ar as "nameAr", 
          permissions, 
          is_active as "isActive"
        FROM roles 
        ORDER BY id ASC;
      `);
      const fbRows = Array.isArray(fallback) ? fallback : (fallback as any)?.rows || [];
      return NextResponse.json(fbRows, { status: 200 });
    } catch (err: any) {
      console.error('Error fetching roles:', err);
      return NextResponse.json(
        { message: 'فشل استرجاع الأدوار', error: err?.message },
        { status: 500 }
      );
    }
  }
}

// 2. إضافة دور جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = body.name || body.nameAr || 'دور جديد';
    const nameAr = body.nameAr || name;
    const permissions = body.permissions || ['attendance.view'];
    const permissionsJson = JSON.stringify(permissions);

    try {
      const raw = await db.execute(sql`
        INSERT INTO custom_roles (name, name_ar, permissions, is_system, created_at)
        VALUES (${name}, ${nameAr}, ${permissionsJson}::jsonb, false, NOW())
        RETURNING id, name, name_ar as "nameAr";
      `);
      const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
      return NextResponse.json(rows[0] || { message: 'تم حفظ الدور بنجاح' }, { status: 201 });
    } catch {
      const raw2 = await db.execute(sql`
        INSERT INTO roles (name, name_ar, permissions, is_active)
        VALUES (${name}, ${nameAr}, ${permissionsJson}::jsonb, true)
        RETURNING id, name, name_ar as "nameAr";
      `);
      const rows2 = Array.isArray(raw2) ? raw2 : (raw2 as any)?.rows || [];
      return NextResponse.json(rows2[0] || { message: 'تم حفظ الدور بنجاح' }, { status: 201 });
    }
  } catch (error: any) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { message: 'فشل حفظ الدور', error: error?.message },
      { status: 500 }
    );
  }
}
