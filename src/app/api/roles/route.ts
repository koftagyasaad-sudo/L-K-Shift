import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// الأدوار الافتراضية بنفس مسمياتها وصلاحياتها القديمة
const INITIAL_ROLES = [
  {
    name: 'Admin',
    nameAr: 'مدير',
    permissions: [],
    isSystem: true,
  },
  {
    name: 'SUPER_ADMIN',
    nameAr: 'مدير النظام',
    permissions: ['*'],
    isSystem: true,
  },
  {
    name: 'call center',
    nameAr: 'كول سنتر',
    permissions: ['attendance.view', 'leaves.request'],
    isSystem: false,
  },
  {
    name: 'admin',
    nameAr: 'مدير فرع',
    permissions: [
      'dashboard.view',
      'attendance.view',
      'attendance.review',
      'employees.view',
      'leaves.approve',
    ],
    isSystem: false,
  },
  {
    name: 'HR',
    nameAr: 'مدير موارد بشرية',
    permissions: [
      'dashboard.view',
      'attendance.review',
      'attendance.zk_sheet',
      'employees.view',
      'employees.manage',
      'hr_files.view',
      'recruitment.view',
      'recruitment.manage',
      'leaves.approve',
      'staff_requests.manage',
    ],
    isSystem: false,
  },
  {
    name: 'opreation',
    nameAr: 'مدير تشغيل',
    permissions: [
      'dashboard.view',
      'dashboard.analytics',
      'attendance.view',
      'attendance.review',
      'employees.view',
      'branches.view',
      'leaves.approve',
      'staff_requests.manage',
    ],
    isSystem: false,
  },
  {
    name: 'accounting',
    nameAr: 'مدير مالي',
    permissions: [
      'dashboard.view',
      'dashboard.analytics',
      'attendance.review',
      'attendance.zk_sheet',
      'employees.view',
      'hr_files.view',
      'branches.view',
      'leaves.approve',
    ],
    isSystem: false,
  },
  {
    name: 'owner',
    nameAr: 'owner',
    permissions: [
      'dashboard.view',
      'dashboard.analytics',
      'attendance.view',
      'attendance.review',
      'attendance.zk_sheet',
      'employees.view',
      'employees.manage',
      'hr_files.view',
      'branches.view',
      'branches.manage',
      'roles.view',
      'recruitment.view',
      'leaves.approve',
    ],
    isSystem: false,
  },
  {
    name: 'team',
    nameAr: 'عضو فريق',
    permissions: ['attendance.view'],
    isSystem: false,
  },
];

export async function GET() {
  try {
    // 1. التأكد من إنشاء جدول custom_roles
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS custom_roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        name_ar VARCHAR(150) NOT NULL,
        permissions JSONB DEFAULT '[]'::jsonb,
        is_system BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. التحقق من وجود الأدوار وتثبيتها إن كان الجدول فارغاً
    const existing = await db.execute(sql`SELECT COUNT(*)::int as count FROM custom_roles;`);
    const count = (existing as any)?.rows?.[0]?.count ?? (existing as any)?.[0]?.count ?? 0;

    if (count === 0) {
      for (const r of INITIAL_ROLES) {
        await db.execute(sql`
          INSERT INTO custom_roles (name, name_ar, permissions, is_system, created_at, updated_at)
          VALUES (
            ${r.name},
            ${r.nameAr},
            ${JSON.stringify(r.permissions)}::jsonb,
            ${r.isSystem},
            NOW(),
            NOW()
          ) ON CONFLICT (name) DO NOTHING;
        `);
      }
    }

    const raw = await db.execute(sql`
      SELECT 
        id,
        name,
        name_ar as "nameAr",
        permissions,
        is_system as "isSystem"
      FROM custom_roles
      ORDER BY id ASC;
    `);

    const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    return NextResponse.json(rows, { status: 200 });
  } catch (error: any) {
    console.error('Roles GET error:', error);
    return NextResponse.json(INITIAL_ROLES.map((r, i) => ({ id: i + 1, ...r })), { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, nameAr, permissions } = body;

    if (!name || !nameAr) {
      return NextResponse.json({ message: 'اسم الدور والمعرف البرمجي مطلوبان' }, { status: 400 });
    }

    const permsJson = JSON.stringify(Array.isArray(permissions) ? permissions : []);

    if (id) {
      await db.execute(sql`
        UPDATE custom_roles
        SET 
          name = ${name.trim()},
          name_ar = ${nameAr.trim()},
          permissions = ${permsJson}::jsonb,
          updated_at = NOW()
        WHERE id = ${parseInt(id, 10)};
      `);
      return NextResponse.json({ success: true, message: 'تم تحديث الدور والصلاحيات بنجاح' });
    } else {
      await db.execute(sql`
        INSERT INTO custom_roles (name, name_ar, permissions, is_system, created_at, updated_at)
        VALUES (
          ${name.trim()},
          ${nameAr.trim()},
          ${permsJson}::jsonb,
          false,
          NOW(),
          NOW()
        );
      `);
      return NextResponse.json({ success: true, message: 'تم إنشاء الدور الجديد بنجاح' });
    }
  } catch (error: any) {
    console.error('Roles POST error:', error);
    return NextResponse.json({ message: error?.message || 'فشل حفظ الدور' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'معرف الدور مطلوب' }, { status: 400 });
    }

    await db.execute(sql`
      DELETE FROM custom_roles 
      WHERE id = ${parseInt(id, 10)} AND is_system = false;
    `);

    return NextResponse.json({ success: true, message: 'تم حذف الدور بنجاح' });
  } catch (error: any) {
    console.error('Roles DELETE error:', error);
    return NextResponse.json({ message: error?.message || 'فشل حذف الدور' }, { status: 500 });
  }
}
