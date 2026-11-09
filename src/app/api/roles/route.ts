import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { authorizeApi, canAccessBranch } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const INITIAL_ROLES = [
  {
    name: 'Admin',
    nameAr: 'مدير',
    permissions: [],
    branchScope: 'ALL',
    allowedBranchIds: [],
    isSystem: true,
  },
  {
    name: 'SUPER_ADMIN',
    nameAr: 'مدير النظام',
    permissions: ['*'],
    branchScope: 'ALL',
    allowedBranchIds: [],
    isSystem: true,
  },
  {
    name: 'call center',
    nameAr: 'كول سنتر',
    permissions: ['attendance.view', 'leaves.request'],
    branchScope: 'ALL',
    allowedBranchIds: [],
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
    branchScope: 'OWN_BRANCH',
    allowedBranchIds: [],
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
    branchScope: 'ALL',
    allowedBranchIds: [],
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
    branchScope: 'ALL',
    allowedBranchIds: [],
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
      'payroll.view',
      'employees.view',
      'hr_files.view',
      'branches.view',
      'leaves.approve',
    ],
    branchScope: 'ALL',
    allowedBranchIds: [],
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
      'payroll.view',
      'payroll.export',
      'recruitment.view',
      'leaves.approve',
    ],
    branchScope: 'ALL',
    allowedBranchIds: [],
    isSystem: false,
  },
  {
    name: 'team',
    nameAr: 'عضو فريق',
    permissions: ['attendance.view'],
    branchScope: 'OWN_BRANCH',
    allowedBranchIds: [],
    isSystem: false,
  },
];

function sanitizePermissions(perms: any): string[] {
  if (!perms) return [];
  if (Array.isArray(perms)) return perms.filter((permission): permission is string => typeof permission === 'string');
  if (typeof perms === 'string') {
    try {
      const parsed = JSON.parse(perms);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.keys(parsed).filter((k) => (parsed as any)[k]);
      }
    } catch {
      return perms ? [perms] : [];
    }
  }
  if (typeof perms === 'object' && perms !== null) {
    return Object.keys(perms).filter((k) => (perms as any)[k]);
  }
  return [];
}

function sanitizeBranchIds(ids: any): number[] {
  if (!ids) return [];
  if (Array.isArray(ids)) {
    return ids.map((x) => Number(x)).filter((n) => Number.isSafeInteger(n) && n > 0);
  }
  if (typeof ids === 'string') {
    try {
      const parsed = JSON.parse(ids);
      if (Array.isArray(parsed)) {
        return parsed.map((x) => Number(x)).filter((n) => Number.isSafeInteger(n) && n > 0);
      }
    } catch {
      return [];
    }
  }
  return [];
}

export async function GET() {
  try {
    const authorization = await authorizeApi(['roles.view', 'roles.manage']);
    if ('response' in authorization) return authorization.response;

    // Migrations applied in Neon

    const existing = // Migrations applied in Neon

    const permsArray = sanitizePermissions(permissions);
    if (permsArray.includes('*')) {
      return NextResponse.json({ message: 'لا يمكن منح صلاحية المدير العام لدور مخصص' }, { status: 400 });
    }
    if (
      authorization.principal.systemRole !== 'SUPER_ADMIN' &&
      permsArray.some((permission) => !authorization.principal.permissions.includes(permission))
    ) {
      return NextResponse.json({ message: 'لا يمكن منح صلاحيات غير متاحة لك' }, { status: 403 });
    }
    const permsJson = JSON.stringify(permsArray);
    const scope = branchScope === undefined ? 'ALL' : branchScope;
    if (typeof scope !== 'string') {
      return NextResponse.json({ message: 'نطاق الفروع غير صالح' }, { status: 400 });
    }
    if (!['ALL', 'OWN_BRANCH', 'CUSTOM'].includes(scope)) {
      return NextResponse.json({ message: 'نطاق الفروع غير صالح' }, { status: 400 });
    }
    if (
      authorization.principal.systemRole !== 'SUPER_ADMIN' &&
      scope === 'ALL' &&
      authorization.principal.branchScope !== 'ALL'
    ) {
      return NextResponse.json({ message: 'لا يمكن توسيع نطاق الفروع' }, { status: 403 });
    }
    const branchIds = sanitizeBranchIds(allowedBranchIds);
    if (
      authorization.principal.systemRole !== 'SUPER_ADMIN' &&
      branchIds.some((branchId) => !canAccessBranch(authorization.principal, branchId))
    ) {
      return NextResponse.json({ message: 'لا يمكن منح نطاق فروع غير متاح لك' }, { status: 403 });
    }
    const branchIdsJson = JSON.stringify(branchIds);

    if (id) {
      const roleId = Number(id);
      if (!Number.isSafeInteger(roleId) || roleId < 1) {
        return NextResponse.json({ message: 'معرف الدور غير صالح' }, { status: 400 });
      }
      if (authorization.principal.systemRole !== 'SUPER_ADMIN') {
        const result = await db.execute(sql`
          SELECT is_system FROM custom_roles WHERE id = ${roleId} LIMIT 1;
        `);
        const role = (result as unknown as { rows?: { is_system: boolean }[] }).rows?.[0]
          ?? (Array.isArray(result) ? result[0] as { is_system: boolean } | undefined : undefined);
        if (!role) return NextResponse.json({ message: 'الدور غير موجود' }, { status: 404 });
        if (role.is_system) {
          return NextResponse.json({ message: 'لا يمكن تعديل دور نظامي' }, { status: 403 });
        }
      }
      await db.execute(sql`
        UPDATE custom_roles
        SET 
          name = ${name.trim()},
          name_ar = ${nameAr.trim()},
          permissions = ${permsJson}::jsonb,
          branch_scope = ${scope},
          allowed_branch_ids = ${branchIdsJson}::jsonb,
          updated_at = NOW()
        WHERE id = ${roleId} AND (${authorization.principal.systemRole === 'SUPER_ADMIN'} OR is_system = false);
      `);
      return NextResponse.json({ success: true, message: 'تم تحديث الدور والصلاحيات بنجاح' });
    } else {
      await db.execute(sql`
        INSERT INTO custom_roles (name, name_ar, permissions, branch_scope, allowed_branch_ids, is_system, created_at, updated_at)
        VALUES (
          ${name.trim()},
          ${nameAr.trim()},
          ${permsJson}::jsonb,
          ${scope},
          ${branchIdsJson}::jsonb,
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
    const authorization = await authorizeApi('roles.manage');
    if ('response' in authorization) return authorization.response;

    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');

    if (!idParam) {
      return NextResponse.json({ message: 'معرف الدور مطلوب' }, { status: 400 });
    }
    const id = Number(idParam);
    if (!Number.isSafeInteger(id) || id < 1) {
      return NextResponse.json({ message: 'معرف الدور غير صالح' }, { status: 400 });
    }

    await db.execute(sql`
      DELETE FROM custom_roles 
      WHERE id = ${id} AND is_system = false;
    `);

    return NextResponse.json({ success: true, message: 'تم حذف الدور بنجاح' });
  } catch (error: any) {
    console.error('Roles DELETE error:', error);
    return NextResponse.json({ message: error?.message || 'فشل حذف الدور' }, { status: 500 });
  }
}
