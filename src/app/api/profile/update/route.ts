import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      fullName,
      fullNameEn,
      phone,
      phoneAlt,
      nationalId,
      nationalIdExpiry,
      socialInsuranceNo,
      drivingLicense,
      birthDate,
      gender,
      maritalStatus,
      militaryStatus,
      address,
      emergencyName,
      emergencyRelation,
      emergencyPhone,
      payoutMethod,
      payoutAccount,
      bankName,
      educationLevel,
      educationField,
      graduationYear,
      profilePhoto,
      currentPassword,
      newPassword,
    } = body;

    if (!userId) {
      return NextResponse.json({ message: 'معرف المستخدم مفقود' }, { status: 400 });
    }

    const numericId = parseInt(userId, 10);
    if (isNaN(numericId)) {
      return NextResponse.json({ message: 'معرف المستخدم غير صالح' }, { status: 400 });
    }

    // استرجاع كلمة المرور الحالية للتأكد من صحتها
    const existingRaw = await db.execute(sql`
      SELECT id, password, full_name_ar FROM users WHERE id = ${numericId} LIMIT 1;
    `);
    const existingUsers = Array.isArray(existingRaw) ? existingRaw : (existingRaw as any)?.rows || [];

    if (!existingUsers.length) {
      return NextResponse.json({ message: 'المستخدم غير موجود بالنظام' }, { status: 404 });
    }

    const currentUser = existingUsers[0];

    // التحقق من كلمة المرور القديمة عند الرغبة في التغيير
    let shouldUpdatePassword = false;
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ message: 'يجب إدخال كلمة المرور الحالية لإتمام التغيير' }, { status: 400 });
      }

      // مطابقة كلمة المرور المدخلة مع المسجلة
      if (currentUser.password && currentUser.password !== currentPassword) {
        return NextResponse.json({ message: 'كلمة المرور الحالية غير صحيحة، يرجى المحاولة مرة أخرى' }, { status: 400 });
      }

      shouldUpdatePassword = true;
    }

    // تحديث قاعدة البيانات
    await db.execute(sql`
      UPDATE users
      SET
        full_name_ar = COALESCE(${fullName || null}, full_name_ar),
        phone = COALESCE(${phone || null}, phone),
        address = COALESCE(${address || null}, address),
        emergency_contact = COALESCE(${emergencyPhone || null}, emergency_contact),
        updated_at = NOW()
        ${shouldUpdatePassword ? sql`, password = ${newPassword}` : sql``}
      WHERE id = ${numericId};
    `);

    return NextResponse.json({
      success: true,
      message: 'تم تحديث استمارة الملف الشخصي بنجاح',
    });
  } catch (error: any) {
    console.error('Profile update API error:', error);
    return NextResponse.json(
      { message: error?.message || 'حدث خطأ غير متوقع أثناء تحديث الملف الشخصي' },
      { status: 500 }
    );
  }
}
