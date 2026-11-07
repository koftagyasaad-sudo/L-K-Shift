import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, name, address, nationalId, emergencyContact, newPassword } = body;

    if (!phone) {
      return NextResponse.json({ message: 'رقم الهاتف مطلوب للتحقق' }, { status: 400 });
    }

    if (newPassword && newPassword.trim().length > 0) {
      await db.execute(sql`
        UPDATE users
        SET 
          full_name_ar = COALESCE(${name}, full_name_ar),
          name = COALESCE(${name}, name),
          address = ${address || ''},
          national_id = ${nationalId || ''},
          emergency_contact = ${emergencyContact || ''},
          password_hash = ${newPassword.trim()},
          updated_at = NOW()
        WHERE phone = ${phone.trim()};
      `);
    } else {
      await db.execute(sql`
        UPDATE users
        SET 
          full_name_ar = COALESCE(${name}, full_name_ar),
          name = COALESCE(${name}, name),
          address = ${address || ''},
          national_id = ${nationalId || ''},
          emergency_contact = ${emergencyContact || ''},
          updated_at = NOW()
        WHERE phone = ${phone.trim()};
      `);
    }

    return NextResponse.json({ success: true, message: 'تم حفظ البيانات بنجاح' });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ message: 'فشل حفظ البيانات', error: error.message }, { status: 500 });
  }
}
