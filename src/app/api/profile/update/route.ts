import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth-security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, phone, fullName, nationalId, address, emergencyContact, newPassword } = body;

    if (!phone && !userId) {
      return NextResponse.json({ message: 'معرف المستخدم أو رقم الهاتف مطلوب' }, { status: 400 });
    }

    if (newPassword && newPassword.trim().length > 0) {
      const hashedPassword = hashPassword(newPassword.trim());

      await db.execute(sql`
        UPDATE users
        SET 
          full_name_ar = COALESCE(${fullName}, full_name_ar),
          name = COALESCE(${fullName}, name),
          national_id = ${nationalId || ''},
          address = ${address || ''},
          emergency_contact = ${emergencyContact || ''},
          password_hash = ${hashedPassword},
          updated_at = NOW()
        WHERE id::text = ${userId} OR phone = ${phone};
      `);
    } else {
      await db.execute(sql`
        UPDATE users
        SET 
          full_name_ar = COALESCE(${fullName}, full_name_ar),
          name = COALESCE(${fullName}, name),
          national_id = ${nationalId || ''},
          address = ${address || ''},
          emergency_contact = ${emergencyContact || ''},
          updated_at = NOW()
        WHERE id::text = ${userId} OR phone = ${phone};
      `);
    }

    return NextResponse.json({ success: true, message: 'تم حفظ استمارة البيانات وتشفير الحساب بنجاح' });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ message: 'فشل حفظ استمارة البيانات', error: error.message }, { status: 500 });
  }
}
