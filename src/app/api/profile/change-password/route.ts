import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { authorizeApi } from '@/lib/api-auth';
import { hashPassword, verifyPassword } from '@/lib/passwords';
import { meetsPasswordMinimum } from '@/lib/password-policy';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { getSqlRows } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const authorization = await authorizeApi();
  if ('response' in authorization) return authorization.response;

  const rateLimit = checkRateLimit(
    `change-password:${authorization.principal.id}:${getClientIp(request)}`,
    5,
    60_000
  );
  if (!rateLimit.success) {
    return NextResponse.json(
      { message: 'محاولات كثيرة. يرجى الانتظار قبل إعادة المحاولة.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ message: 'بيانات الطلب غير صالحة' }, { status: 400 });
    }

    const values = body as Record<string, unknown>;
    const currentPassword = typeof values.currentPassword === 'string' ? values.currentPassword : '';
    const newPassword = typeof values.newPassword === 'string' ? values.newPassword : '';

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: 'كلمة المرور الحالية والجديدة مطلوبتان' }, { status: 400 });
    }
    if (!meetsPasswordMinimum(newPassword) || newPassword.length > 128) {
      return NextResponse.json({ message: 'كلمة المرور الجديدة يجب أن تكون بين 6 و128 محرفًا' }, { status: 400 });
    }

    const raw = await db.execute(sql`
      SELECT COALESCE(password_hash, password, '') AS "passwordHash"
      FROM users
      WHERE id::text = ${authorization.principal.id}::text
      LIMIT 1;
    `);
    const user = getSqlRows<{ passwordHash: string }>(raw)[0];

    if (!user) {
      return NextResponse.json({ message: 'المستخدم غير موجود' }, { status: 404 });
    }

    const verification = await verifyPassword(currentPassword, user.passwordHash);
    if (!verification.isValid) {
      return NextResponse.json({ message: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 });
    }

    await db
      .update(users)
      .set({
        passwordHash: await hashPassword(newPassword),
        updatedAt: new Date(),
      })
      .where(eq(users.id, authorization.principal.id));

    return NextResponse.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    console.error('Change-password route error:', error);
    return NextResponse.json({ message: 'تعذر تغيير كلمة المرور الآن' }, { status: 500 });
  }
}
