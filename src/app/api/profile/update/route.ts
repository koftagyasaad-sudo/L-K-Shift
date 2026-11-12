import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';
import { authorizeApi } from '@/lib/api-auth';
import { meetsPasswordMinimum } from '@/lib/password-policy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// تشفير آمن بملح رقمي SHA-256 / PBKDF2 متوافق وسريع
function hashPassword(password: string): string {
  const salt = 'LK_SHIFT_SECURE_SALT_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function verifyPassword(inputPass: string, storedHash: string): boolean {
  if (!storedHash) return false;
  // 1. مطابقة صريحة للحسابات القديمة المسجلة بنص عادي
  if (storedHash === inputPass) return true;
  // 2. مطابقة التشفير الأمني الجديد
  const hashedInput = hashPassword(inputPass);
  if (storedHash === hashedInput) return true;
  return false;
}

// شرط الباسورد القوي: 8 خانات على الأقل، حرف كبير، حرف صغير، رقم، رمز خاص
function isPasswordStrong(pass: string): boolean {
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  return strongRegex.test(pass);
}

export async function GET(request: NextRequest) {
  try {
    const authorization = await authorizeApi();
    if ('response' in authorization) return authorization.response;

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('id');
    if (requestedUserId && requestedUserId !== authorization.principal.id) {
      return NextResponse.json({ message: 'ممنوع' }, { status: 403 });
    }
    const userId = authorization.principal.id;

    const raw = await db.execute(sql`
      SELECT 
        u.id,
        COALESCE(u.full_name_ar, u.name, '') as "fullName",
        COALESCE(u.full_name_en, '') as "fullNameEn",
        COALESCE(u.phone, '') as phone,
        COALESCE(u.phone_alt, '') as "phoneAlt",
        COALESCE(u.national_id, '') as "nationalId",
        TO_CHAR(u.national_id_expiry, 'YYYY-MM-DD') as "nationalIdExpiry",
        TO_CHAR(u.birth_date, 'YYYY-MM-DD') as "birthDate",
        COALESCE(u.gender, 'MALE') as gender,
        COALESCE(u.marital_status, '') as "maritalStatus",
        COALESCE(u.military_status, '') as "militaryStatus",
        COALESCE(u.address, '') as address,
        COALESCE(u.social_insurance_no, '') as "socialInsuranceNo",
        COALESCE(u.driving_license, '') as "drivingLicense",
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
        COALESCE(u.password_hash, '') as "passwordHash"
      FROM users u
      WHERE u.id::text = ${userId}
      LIMIT 1;
    `);

    const users = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    if (!users.length) {
      return NextResponse.json({ message: 'المستخدم غير موجود' }, { status: 404 });
    }

    const u = users[0];
    const isWeak = !u.passwordHash || u.passwordHash === '123456' || !isPasswordStrong(u.passwordHash);

    return NextResponse.json({
      ...u,
      mustChangePassword: isWeak,
      passwordHash: undefined, // عدم تصدير الهاش للواجهة
    }, { status: 200 });
  } catch (error: any) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ message: 'حدث خطأ أثناء جلب الملف الشخصي' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorization = await authorizeApi();
    if ('response' in authorization) return authorization.response;

    const body = await request.json();
    const {
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

    const userId = String(authorization.principal.id);

    // جلب الباسورد الحالي من قاعدة البيانات للتحقق الدقيق
    const currentQuery = await db.execute(sql`
      SELECT id, password_hash, password FROM users WHERE id::text = ${userId} LIMIT 1;
    `);
    const currentRows = Array.isArray(currentQuery) ? currentQuery : (currentQuery as any)?.rows || [];
    if (!currentRows.length) {
      return NextResponse.json({ message: 'المستخدم غير مسجل' }, { status: 404 });
    }

    const userDb = currentRows[0];
    const existingPasswordHash = userDb.password_hash || userDb.password || '';

    // معالجة تغيير كلمة المرور إن طُلبت
    let finalPasswordHash = existingPasswordHash;
    if (newPassword && newPassword.trim() !== '') {
      const trimmedNewPass = newPassword.trim();
      const trimmedCurrentPass = currentPassword ? currentPassword.trim() : '';

      // 1. التحقق من كلمة المرور الحالية (سواء قديمة نصية أو مشفرة)
      const isCurrentCorrect = verifyPassword(trimmedCurrentPass, existingPasswordHash);
      if (!isCurrentCorrect) {
        return NextResponse.json({
          message: 'كلمة المرور الحالية غير صحيحة، يرجى التأكد وإعادة المحاولة.',
        }, { status: 400 });
      }

      // 2. تطبيق الحد الأدنى لطول كلمة المرور
      if (!meetsPasswordMinimum(trimmedNewPass)) {
        return NextResponse.json({
          message: 'يجب أن تتكون كلمة المرور من 6 محارف على الأقل.',
        }, { status: 400 });
      }

      // 3. التشفير قبل الحفظ
      finalPasswordHash = hashPassword(trimmedNewPass);
    }

    const gradYearNum = graduationYear ? parseInt(graduationYear, 10) : null;
    const bDate = birthDate ? birthDate : null;
    const nExpiry = nationalIdExpiry ? nationalIdExpiry : null;

    await db.execute(sql`
      UPDATE users
      SET 
        full_name_ar = COALESCE(NULLIF(${fullName || ''}, ''), full_name_ar),
        name = COALESCE(NULLIF(${fullName || ''}, ''), name),
        full_name_en = ${fullNameEn || null},
        phone = COALESCE(NULLIF(${phone || ''}, ''), phone),
        phone_alt = ${phoneAlt || null},
        national_id = ${nationalId || null},
        national_id_expiry = NULLIF(${nExpiry}, '')::date,
        social_insurance_no = ${socialInsuranceNo || null},
        driving_license = ${drivingLicense || null},
        birth_date = NULLIF(${bDate}, '')::date,
        gender = ${gender || 'MALE'},
        marital_status = ${maritalStatus || null},
        military_status = ${militaryStatus || null},
        address = ${address || null},
        emergency_name = ${emergencyName || null},
        emergency_relation = ${emergencyRelation || null},
        emergency_contact = ${emergencyPhone || null},
        payout_method = ${payoutMethod || 'INSTAPAY'},
        payout_account = ${payoutAccount || null},
        bank_name = ${bankName || null},
        education_level = ${educationLevel || null},
        education_field = ${educationField || null},
        graduation_year = ${gradYearNum},
        avatar_url = COALESCE(NULLIF(${profilePhoto || ''}, ''), avatar_url),
        password_hash = ${finalPasswordHash},
        updated_at = NOW()
      WHERE id::text = ${userId};
    `);

    return NextResponse.json({
      success: true,
      message: 'تم تحديث الملف الشخصي وكلمة المرور بنجاح!',
    }, { status: 200 });
  } catch (error: any) {
    console.error('Profile POST error:', error);
    return NextResponse.json({
      message: error?.message || 'حدث خطأ غير متوقع أثناء حفظ البيانات',
    }, { status: 500 });
  }
}
