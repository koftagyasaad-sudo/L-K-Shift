import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { authorizeApi } from '@/lib/api-auth';
import { hashPassword } from '@/lib/passwords';
import { meetsPasswordMinimum } from '@/lib/password-policy';
import { getSqlRows } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const authorization = await authorizeApi('employees.manage');
    if ('response' in authorization) return authorization.response;

    if (
      authorization.principal.systemRole !== 'SUPER_ADMIN'
      && authorization.principal.systemRole !== 'ADMIN'
    ) {
      return NextResponse.json({ message: 'ممنوع' }, { status: 403 });
    }

    const { id } = await context.params;
    const employeeId = id.trim();
    if (!employeeId) {
      return NextResponse.json({ message: 'معرف الموظف مطلوب' }, { status: 400 });
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ message: 'بيانات الطلب غير صالحة' }, { status: 400 });
    }

    const values = body as Record<string, unknown>;
    const newPassword = typeof values.newPassword === 'string' ? values.newPassword : '';
    if (!meetsPasswordMinimum(newPassword) || newPassword.length > 128) {
      return NextResponse.json({ message: 'كلمة المرور يجب أن تكون بين 6 و128 محرفًا' }, { status: 400 });
    }

    const raw = await db.execute(sql`
      UPDATE users
      SET password_hash = ${await hashPassword(newPassword)}, updated_at = NOW()
      WHERE id::text = ${employeeId}::text
      RETURNING id::text AS id;
    `);
    const updated = getSqlRows<{ id: string }>(raw);
    if (!updated.length) {
      return NextResponse.json({ message: 'الموظف غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'تم إعادة تعيين كلمة مرور الموظف بنجاح' });
  } catch (error) {
    console.error('Employee password reset error:', error);
    return NextResponse.json({ message: 'تعذر إعادة تعيين كلمة المرور الآن' }, { status: 500 });
  }
}
