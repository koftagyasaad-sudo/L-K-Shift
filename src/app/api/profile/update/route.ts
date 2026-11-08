import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id') || searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'معرف المستخدم مفقود' }, { status: 400 });
    }

    const numericId = parseInt(userId, 10);
    if (isNaN(numericId)) {
      return NextResponse.json({ message: 'معرف غير صالح' }, { status: 400 });
    }

    const result = await db.execute(sql`
      SELECT 
        u.id,
        COALESCE(u.full_name_ar, u.name, 'موظف') as "fullName",
        COALESCE(u.full_name_en, '') as "fullNameEn",
        COALESCE(u.phone, '') as "phone",
        COALESCE(u.phone_alt, '') as "phoneAlt",
        COALESCE(u.national_id, '') as "nationalId",
        TO_CHAR(u.national_id_expiry, 'YYYY-MM-DD') as "nationalIdExpiry",
        COALESCE(u.social_insurance_no, '') as "socialInsuranceNo",
        COALESCE(u.driving_license, '') as "drivingLicense",
        TO_CHAR(u.birth_date, 'YYYY-MM-DD') as "birthDate",
        COALESCE(u.gender, 'MALE') as "gender",
        COALESCE(u.marital_status, '') as "maritalStatus",
        COALESCE(u.military_status, '') as "militaryStatus",
        COALESCE(u.address, '') as "address",
        COALESCE(u.emergency_name, '') as "emergencyName",
        COALESCE(u.emergency_relation, '') as "emergencyRelation",
        COALESCE(u.emergency_contact, '') as "emergencyPhone",
        COALESCE(u.payout_method, 'INSTAPAY') as "payoutMethod",
        COALESCE(u.payout_account, '') as "payoutAccount",
        COALESCE(u.bank_name, '') as "bankName",
        COALESCE(u.education_level, '') as "educationLevel",
        COALESCE(u.education_field, '') as "educationField",
        u.graduation_year as "graduationYear",
        COALESCE(u.avatar_url, '') as "avatarUrl",
        COALESCE(u.job_role, u.system_role::text, 'موظف') as "role"
      FROM users u
      WHERE u.id = ${numericId}
      LIMIT 1;
    `);

    const usersList = Array.isArray(result) ? result : (result as any)?.rows || [];
    if (!usersList.length) {
      return NextResponse.json({ message: 'المستخدم غير موجود' }, { status: 404 });
    }

    return NextResponse.json(usersList[0], { status: 200 });
  } catch (error: any) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ message: 'فشل جلب البيانات' }, { status: 500 });
  }
}

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

    // التحقق من كلمة المرور القديمة في حال الرغبة في التغيير
    if (newPassword) {
      const userCheck = await db.execute(sql`
        SELECT id, password_hash FROM users WHERE id = ${numericId} LIMIT 1;
      `);
      const existing = Array.isArray(userCheck) ? userCheck : (userCheck as any)?.rows || [];
      if (existing.length > 0) {
        const storedPwd = existing[0].password_hash;
        if (storedPwd && storedPwd !== currentPassword) {
          return NextResponse.json({ message: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 });
        }
      }
    }

    // حفظ وتحديث كافة بيانات الاستمارة والصورة الشخصية من أول مرة
    await db.execute(sql`
      UPDATE users
      SET
        full_name_ar = COALESCE(${fullName || null}, full_name_ar),
        full_name_en = ${fullNameEn || null},
        phone = COALESCE(${phone || null}, phone),
        phone_alt = ${phoneAlt || null},
        national_id = ${nationalId || null},
        national_id_expiry = ${nationalIdExpiry ? sql`${nationalIdExpiry}::date` : null},
        social_insurance_no = ${socialInsuranceNo || null},
        driving_license = ${drivingLicense || null},
        birth_date = ${birthDate ? sql`${birthDate}::date` : null},
        gender = COALESCE(${gender || 'MALE'}, gender),
        marital_status = ${maritalStatus || null},
        military_status = ${militaryStatus || null},
        address = ${address || null},
        emergency_name = ${emergencyName || null},
        emergency_relation = ${emergencyRelation || null},
        emergency_contact = ${emergencyPhone || null},
        payout_method = COALESCE(${payoutMethod || 'INSTAPAY'}, payout_method),
        payout_account = ${payoutAccount || null},
        bank_name = ${bankName || null},
        education_level = ${educationLevel || null},
        education_field = ${educationField || null},
        graduation_year = ${graduationYear ? parseInt(graduationYear, 10) : null},
        avatar_url = COALESCE(${profilePhoto || null}, avatar_url),
        updated_at = NOW()
        ${newPassword ? sql`, password_hash = ${newPassword}` : sql``}
      WHERE id = ${numericId};
    `);

    return NextResponse.json({
      success: true,
      message: 'تم حفظ كافة بيانات استمارتك الشخصية وصورتك بنجاح!',
    });
  } catch (error: any) {
    console.error('Profile POST error:', error);
    return NextResponse.json({ message: error?.message || 'فشل تحديث البيانات' }, { status: 500 });
  }
}
