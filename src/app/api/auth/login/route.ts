import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const JWT_SECRET = process.env.JWT_SECRET || 'LK_SHIFT_SUPER_SECURE_JWT_SECRET_KEY_2026';

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function createSignedJwt(payload: object): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyPassword(inputPass: string, storedHash: string): boolean {
  if (!storedHash) return false;
  // 1. مطابقة مباشرة للحسابات القديمة المسجلة بنص عادي
  if (storedHash === inputPass) return true;

  // 2. مطابقة تشفير PBKDF2
  const salt = 'LK_SHIFT_SECURE_SALT_2026';
  const hashedInput = crypto.pbkdf2Sync(inputPass, salt, 1000, 64, 'sha512').toString('hex');
  if (storedHash === hashedInput) return true;

  // 3. مطابقة تشفير bcrypt في حال وُجدت هاشات قديمة تبدأ بـ $2
  if (storedHash.startsWith('$2')) {
    try {
      const bcrypt = require('bcryptjs');
      if (bcrypt.compareSync(inputPass, storedHash)) return true;
    } catch {
      try {
        const bcrypt = require('bcrypt');
        if (bcrypt.compareSync(inputPass, storedHash)) return true;
      } catch {}
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // التقاط اسم المستخدم أو رقم الهاتف بجميع التسميات الممكنة التي ترسلها شاشات الدخول
    const trimmedUser = String(
      body.phone ?? 
      body.username ?? 
      body.identifier ?? 
      body.login ?? 
      body.code ?? 
      body.employeeNumber ?? 
      ''
    ).trim();

    const trimmedPass = String(
      body.password ?? 
      body.pass ?? 
      ''
    ).trim();

    if (!trimmedUser || !trimmedPass) {
      return NextResponse.json(
        { message: 'اسم الدخول (الهاتف/المسلسل) وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    const raw = await db.execute(sql`
      SELECT 
        u.id,
        COALESCE(u.full_name_ar, u.name, 'موظف') as "fullNameAr",
        u.phone,
        COALESCE(NULLIF(TRIM(u.employee_number), ''), LPAD(u.id::text, 3, '0')) as "employeeCode",
        COALESCE(u.password_hash, u.password, '') as "passwordHash",
        COALESCE(u.job_role, u.system_role::text, 'موظف') as "role",
        COALESCE(u.system_role::text, 'EMPLOYEE') as "systemRole",
        COALESCE(u.primary_branch_id, u.branch_id, 1) as "branchId",
        COALESCE(b.name_ar, b.name, 'الفرع الرئيسي') as "branchName",
        COALESCE(u.is_active, true) as "isActive",
        COALESCE(u.shift_start_time, '10:00') as "shiftStartTime",
        COALESCE(u.shift_end_time, '18:00') as "shiftEndTime"
      FROM users u
      LEFT JOIN branches b ON b.id = COALESCE(u.primary_branch_id, u.branch_id, 1)
      WHERE u.phone = ${trimmedUser} 
         OR u.employee_number = ${trimmedUser}
         OR u.id::text = ${trimmedUser}
      LIMIT 1;
    `);

    const users = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    if (!users.length) {
      return NextResponse.json(
        { message: 'بيانات الدخول غير صحيحة، يرجى التأكد من رقم الهاتف أو الكود' },
        { status: 401 }
      );
    }

    const user = users[0];

    if (!user.isActive) {
      return NextResponse.json(
        { message: 'هذا الحساب موقوف حالياً من قبل الإدارة' },
        { status: 403 }
      );
    }

    const isMatch = verifyPassword(trimmedPass, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { message: 'كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    let userPermissions: string[] = [];
    let branchScope = 'ALL';
    let allowedBranchIds: number[] = [];

    try {
      const roleRaw = await db.execute(sql`
        SELECT permissions, branch_scope, allowed_branch_ids 
        FROM custom_roles 
        WHERE name = ${user.role} OR name_ar = ${user.role}
        LIMIT 1;
      `);
      const roleRows = Array.isArray(roleRaw) ? roleRaw : (roleRaw as any)?.rows || [];
      if (roleRows.length > 0) {
        const rData = roleRows[0];
        userPermissions = Array.isArray(rData.permissions) ? rData.permissions : [];
        branchScope = rData.branch_scope || 'ALL';
        allowedBranchIds = Array.isArray(rData.allowed_branch_ids) ? rData.allowed_branch_ids : [];
      }
    } catch {}

    const isSuperAdmin = user.systemRole === 'SUPER_ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'مدير النظام';
    if (isSuperAdmin) {
      userPermissions = ['*'];
      branchScope = 'ALL';
    }

    const tokenPayload = {
      sub: String(user.id),
      userId: user.id,
      name: user.fullNameAr,
      role: user.role,
      branchId: user.branchId,
      branchScope,
      permissions: userPermissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
    };

    const token = createSignedJwt(tokenPayload);

    const response = NextResponse.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: {
        id: user.id,
        name: user.fullNameAr,
        fullName: user.fullNameAr,
        phone: user.phone,
        code: user.employeeCode,
        role: user.role,
        branchId: user.branchId,
        branchName: user.branchName,
        shiftStart: user.shiftStartTime,
        shiftEnd: user.shiftEndTime,
        permissions: userPermissions,
        branchScope,
        allowedBranchIds,
      },
    });

    response.cookies.set({
      name: 'lk_session_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ message: error?.message || 'حدث خطأ أثناء الدخول' }, { status: 500 });
  }
}
