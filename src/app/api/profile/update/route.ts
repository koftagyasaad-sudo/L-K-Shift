import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 1. جلب بيانات الملف الشخصي لأي موظف مسجل
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id') || searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'معرف المستخدم غير محدد' }, { status: 400 });
    }

    const numericId = parseInt(userId, 10);
    if (isNaN(numericId)) {
      return NextResponse.json({ message: 'معرف المستخدم غير صالح' }, { status: 400 });
    }

    const result = await db.execute(sql`
      SELECT 
        u.id,
        COALESCE(u.full_name_ar, u.name, 'موظف') as "fullName",
        COALESCE(u.full_name_en, '') as "fullNameEn",
        COALESCE(u.phone, '') as "phone",
        COALESCE(u.phone_alt, '') as "phoneAlt",
        COALESCE(u.national_id, '') as "nationalId",
        u.national_id_expiry as "nationalIdExpiry",
        COALESCE(u.social_insurance_no, '') as "socialInsuranceNo",
        COALESCE(u.driving_license, '') as "drivingLicense",
        u.birth_date as "birthDate",
        COALESCE(u.gender, 'MALE') as "gender",
        COALESCE(u.marital_status, '') as "maritalStatus",
        COALESCE(u.military_status, '') as "militaryStatus",
        COALESCE(u.address, '') as "address",
        COALESCE(u.emergency_name, '') as "emergencyName",
        COALESCE(u.emergency_relation, '') as "emergencyRelation",
        COALESCE(u.emergency_contact, u.emergency_phone, '') as "emergencyPhone",
        COALESCE(u.payout_method, 'INSTAPAY') as "payoutMethod",
        COALESCE(u.payout_account, '') as "payoutAccount",
        COALESCE(u.bank_name, '') as "bankName",
        COALESCE(u.education_level, '') as "educationLevel",
        COALESCE(u.education_field, '') as "educationField",
        u.graduation_year as "graduationYear",
        COALESCE(u.avatar_url, u.photo_url, '') as "avatarUrl",
        COALESCE(u.job_role, u.role, 'موظف') as "role"
      FROM users u
      WHERE u.id = ${numericId}
      LIMIT 1;
    `);

    const users = Array.isArray(result) ? result : (result as any)?.rows || [];
    if (!users.length) {
      return NextResponse.json({ message: 'المستخدم غير موجود' }, { status: 404 });
    }

    return NextResponse.json(users[0], { status: 200 });
  } catch (error: any) {
    console.error('Profile GET API error:', error);
    return NextResponse.json({ message: 'فشل تحميل بيانات الملف الشخصي', error: error?.message }, { status: 500 });
  }
}

// 2. تحديث استمارة الملف الشخصي وحفظ أمان الحساب
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

    // التحقق من هوية المستخدم وكلمة المرور المسجلة
    const existingRaw = await db.execute(sql`
      SELECT id, password, full_name_ar FROM users WHERE id = ${numericId} LIMIT 1;
    `);
    const existingUsers = Array.isArray(existingRaw) ? existingRaw : (existingRaw as any)?.rows || [];

    if (!existingUsers.length) {
      return NextResponse.json({ message: 'المستخدم غير موجود بالنظام' }, { status: 404 });
    }

    const currentUser = existingUsers[0];

    // التحقق الإلزامي من كلمة المرور الحالية قبل التغيير
    let shouldUpdatePassword = false;
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ message: 'يجب إدخال كلمة المرور الحالية لإتمام التغيير' }, { status: 400 });
      }

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
        ${profilePhoto ? sql`, avatar_url = ${profilePhoto}` : sql``}
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
