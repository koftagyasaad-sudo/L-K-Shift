import { NextRequest, NextResponse } from 'next/server';
import { eq, ilike, or } from 'drizzle-orm';
import { db } from '@/db';
import { notifications, users } from '@/db/schema';
import { hashPassword } from '@/lib/passwords';
import { meetsPasswordMinimum } from '@/lib/password-policy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function isUniqueConstraintError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  if ('code' in error && error.code === '23505') return true;
  return 'cause' in error && isUniqueConstraintError(error.cause);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'بيانات التسجيل غير صالحة.' },
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json(
      { success: false, message: 'بيانات التسجيل غير صالحة.' },
      { status: 400 }
    );
  }

  const values = body as Record<string, unknown>;
  const fullName = typeof values.fullName === 'string' ? values.fullName.trim() : '';
  const phone = typeof values.phone === 'string' ? values.phone.trim() : '';
  const password = typeof values.password === 'string' ? values.password : '';

  if (fullName.length < 2 || fullName.length > 120 || phone.length < 6 || phone.length > 32
    || !meetsPasswordMinimum(password) || password.length > 128) {
    return NextResponse.json(
      { success: false, message: 'يرجى إدخال اسم ورقم هاتف صحيحين وكلمة مرور من 6 محارف على الأقل.' },
      { status: 400 }
    );
  }

  try {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'رقم الهاتف مسجل بالفعل مسبقاً، يمكنك تسجيل الدخول مباشرة' },
        { status: 409 }
      );
    }

    const [newUser] = await db
      .insert(users)
      .values({
        fullNameAr: fullName,
        phone,
        passwordHash: await hashPassword(password),
        systemRole: 'EMPLOYEE',
        jobRole: 'موظف',
      })
      .returning({ id: users.id });
    if (!newUser) throw new Error('Registration did not return a user record.');

    let notificationStatus: 'sent' | 'not_required' | 'failed' = 'not_required';
    try {
      const managers = await db
        .select({ id: users.id })
        .from(users)
        .where(or(
          eq(users.systemRole, 'SUPER_ADMIN'),
          ilike(users.jobRole, '%مدير النظام%'),
          ilike(users.jobRole, '%HR%'),
          ilike(users.jobRole, '%موارد بشرية%')
        ));

      if (managers.length > 0) {
        await db.insert(notifications).values(managers.map((manager) => ({
          userId: manager.id,
          title: 'تسجيل موظف جديد',
          message: `قام الموظف (${fullName}) برقم هاتف (${phone}) بإنشاء حساب جديد بالنظام.`,
          link: '/admin/employees',
        })));
        notificationStatus = 'sent';
      }
    } catch (notifErr) {
      notificationStatus = 'failed';
      console.error('Registration succeeded but manager notifications could not be created:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء حسابك بنجاح! يمكنك الآن تسجيل الدخول.',
      notificationStatus,
    }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { success: false, message: 'رقم الهاتف مسجل بالفعل مسبقاً، يمكنك تسجيل الدخول مباشرة' },
        { status: 409 }
      );
    }

    console.error('Registration API error:', error);
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء إنشاء الحساب.' },
      { status: 500 }
    );
  }
}
