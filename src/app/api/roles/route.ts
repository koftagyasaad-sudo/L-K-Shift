import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const raw = await db.execute(sql`
      SELECT 
        id, 
        name, 
        COALESCE(name_ar, name) as "nameAr", 
        COALESCE(name_ar, name) as "name_ar",
        description, 
        COALESCE(permissions, '[]'::jsonb) as permissions,
        COALESCE(is_system, false) as "isSystem"
      FROM roles
      ORDER BY id ASC;
    `);

    const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    return NextResponse.json(rows, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ message: 'فشل استرجاع الأدوار', error: error?.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = body.name || body.nameAr;
    const nameAr = body.nameAr || body.name_ar || name;
    const description = body.description || '';
    const permissions = JSON.stringify(body.permissions || []);

    if (!nameAr) {
      return NextResponse.json({ message: 'اسم الدور مطلوب' }, { status: 400 });
    }

    const raw = await db.execute(sql`
      INSERT INTO roles (name, name_ar, description, permissions, is_system, created_at, updated_at)
      VALUES (${name}, ${nameAr}, ${description}, ${permissions}::jsonb, false, NOW(), NOW())
      RETURNING id, name, name_ar as "nameAr";
    `);

    const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    return NextResponse.json(rows[0] || { message: 'تم حفظ الدور بنجاح' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating role:', error);
    return NextResponse.json({ message: 'فشل إنشاء الدور', error: error?.message }, { status: 500 });
  }
}
