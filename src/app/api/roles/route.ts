import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// 1. استرجاع قائمة الأدوار المسجلة
export async function GET() {
  try {
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
  } catch (error: any) {
    console.error('Error fetching roles from custom_roles:', error);
    return NextResponse.json(
      { message: 'فشل استرجاع الأدوار', error: error?.message },
      { status: 500 }
    );
  }
}

// 2. إضافة دور جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = body.name || body.nameAr || 'NEW_ROLE';
    const nameAr = body.nameAr || body.name || 'دور مخصص';
    const permissions = Array.isArray(body.permissions) ? body.permissions : ['attendance.check_in'];
    const permissionsJson = JSON.stringify(permissions);

    const insertResult = await db.execute(sql`
      INSERT INTO custom_roles (name, name_ar, permissions, is_system, created_at)
      VALUES (${name}, ${nameAr}, ${permissionsJson}::jsonb, false, NOW())
      RETURNING id, name, name_ar as "nameAr", permissions, is_system as "isSystem";
    `);

    const rows = Array.isArray(insertResult) ? insertResult : (insertResult as any)?.rows || [];
    return NextResponse.json(rows[0] || { message: 'تم حفظ الدور بنجاح' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating custom role:', error);
    return NextResponse.json(
      { message: 'فشل حفظ الدور', error: error?.message },
      { status: 500 }
    );
  }
}

// 3. تحديث دور قائم
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const rawId = body.id || new URL(request.url).searchParams.get('id');

    if (!rawId) {
      return NextResponse.json({ message: 'معرف الدور مطلوب' }, { status: 400 });
    }

    const roleId = parseInt(String(rawId), 10);
    const name = body.name || body.nameAr;
    const nameAr = body.nameAr || body.name;
    const permissions = Array.isArray(body.permissions) ? body.permissions : ['attendance.check_in'];
    const permissionsJson = JSON.stringify(permissions);

    await db.execute(sql`
      UPDATE custom_roles
      SET 
        name = ${name},
        name_ar = ${nameAr},
        permissions = ${permissionsJson}::jsonb
      WHERE id = ${roleId} AND is_system = false;
    `);

    return NextResponse.json({ message: 'تم تحديث الدور بنجاح' }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { message: 'فشل تحديث الدور', error: error?.message },
      { status: 500 }
    );
  }
}

// 4. حذف دور
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get('id');

    if (!rawId) {
      return NextResponse.json({ message: 'معرف الدور مطلوب' }, { status: 400 });
    }

    const roleId = parseInt(String(rawId), 10);

    // حماية أدوار النظام الأساسية من الحذف
    await db.execute(sql`
      DELETE FROM custom_roles 
      WHERE id = ${roleId} AND is_system = false;
    `);

    return NextResponse.json({ message: 'تم حذف الدور بنجاح' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { message: 'فشل حذف الدور', error: error?.message },
      { status: 500 }
    );
  }
}
