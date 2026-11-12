import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { authorizeApi } from '@/lib/api-auth';
import { hashPassword } from '@/lib/passwords';
import { validateStrongPassword } from '@/lib/password-policy';
import { getSqlRows } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface NotificationColumn extends Record<string, unknown> {
  columnName: string;
  isNullable: 'YES' | 'NO';
  columnDefault: string | null;
}

async function insertPasswordResetNotice(employeeId: string) {
  const rawColumns = await db.execute(sql`
    SELECT
      column_name AS "columnName",
      is_nullable AS "isNullable",
      column_default AS "columnDefault"
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'notifications';
  `);
  const columns = getSqlRows<NotificationColumn>(rawColumns);
  const available = new Set(columns.map((column) => column.columnName));

  if (!available.size) {
    console.warn('Password reset completed without a notification: notifications table is unavailable.');
    return;
  }
  if (!['user_id', 'title', 'message'].every((column) => available.has(column))) {
    console.warn('Password reset completed without a notification: notifications table is missing required columns.');
    return;
  }

  const fields = [
    { name: 'user_id', value: sql`${employeeId}` },
    { name: 'title', value: sql`'إعادة تعيين كلمة المرور'` },
    {
      name: 'message',
      value: sql`'قام مسؤول النظام بإعادة تعيين كلمة المرور الخاصة بحسابك. إذا لم تكن تتوقع ذلك، تواصل مع الإدارة.'`,
    },
  ];
  if (available.has('is_read')) {
    fields.push({ name: 'is_read', value: sql`false` });
  }
  if (
    available.has('created_at')
    && columns.some((column) => column.columnName === 'created_at' && column.isNullable === 'NO' && !column.columnDefault)
  ) {
    fields.push({ name: 'created_at', value: sql`CURRENT_TIMESTAMP` });
  }

  const insertable = new Set(fields.map((field) => field.name));
  const unsupportedRequired = columns.some((column) =>
    column.isNullable === 'NO'
    && !column.columnDefault
    && !insertable.has(column.columnName)
  );
  if (unsupportedRequired) {
    console.warn('Password reset completed without a notification: notifications table has unsupported required columns.');
    return;
  }

  await db.execute(sql`
    INSERT INTO notifications (${sql.join(fields.map((field) => sql.identifier(field.name)), sql`, `)})
    VALUES (${sql.join(fields.map((field) => field.value), sql`, `)});
  `);
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
    const pwCheck = validateStrongPassword(newPassword);
    if (!pwCheck.valid) {
      return NextResponse.json({ message: pwCheck.message }, { status: 400 });
    }

    const newPasswordHash = await hashPassword(newPassword);
    const raw = await db.execute(sql`
      UPDATE users
      SET password_hash = ${newPasswordHash}, updated_at = NOW()
      WHERE id::text = ${employeeId}::text
      RETURNING id::text AS id;
    `);
    const updated = getSqlRows<{ id: string }>(raw);
    if (!updated.length) {
      return NextResponse.json({ message: 'الموظف غير موجود' }, { status: 404 });
    }

    let notificationWarning: string | undefined;
    try {
      await insertPasswordResetNotice(updated[0].id);
    } catch (notificationError) {
      console.error('Password was reset, but the notification audit insert failed:', notificationError);
      notificationWarning = 'تم تغيير كلمة المرور، لكن تعذر حفظ إشعار التدقيق.';
    }

    return NextResponse.json({
      success: true,
      message: 'تم إعادة تعيين كلمة مرور الموظف بنجاح',
      ...(notificationWarning ? { notificationWarning } : {}),
    });
  } catch (error) {
    console.error('Employee password reset error:', error);
    return NextResponse.json({ message: 'تعذر إعادة تعيين كلمة المرور الآن' }, { status: 500 });
  }
}
