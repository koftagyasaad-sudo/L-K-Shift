import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { authorizeApi } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const authorization = await authorizeApi('recruitment.view');
  if ('response' in authorization) return authorization.response;

  try {
    const raw = await db.execute(sql`
      SELECT 
        id,
        COALESCE(full_name, 'متقدم جديد') as "fullName",
        COALESCE(phone, '') as "phone",
        COALESCE(national_id, '') as "nationalId",
        COALESCE(birth_date::text, '') as "birthDate",
        COALESCE(applied_role, 'وظيفة عامة') as "appliedRole",
        COALESCE(education, '') as "education",
        COALESCE(military_status, '') as "militaryStatus",
        COALESCE(address, '') as "address",
        COALESCE(expected_salary, '') as "expectedSalary",
        COALESCE(experience_years, '') as "experienceYears",
        COALESCE(notes, '') as "notes",
        COALESCE(status, 'PENDING') as "status",
        created_at as "createdAt"
      FROM recruitment_applications
      ORDER BY id DESC;
    `);

    const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
    return NextResponse.json(rows, { status: 200 });
  } catch (error: any) {
    console.error('Recruitment GET error:', error);
    return NextResponse.json({ message: 'تعذر تحميل طلبات التوظيف.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      phone,
      nationalId,
      birthDate,
      appliedRole,
      education,
      militaryStatus,
      address,
      expectedSalary,
      experienceYears,
      notes,
    } = body;

    if (!fullName || !phone) {
      return NextResponse.json({ message: 'الاسم ورقم الهاتف مطلوبان' }, { status: 400 });
    }

    // إنشاء الجدول تلقائياً إن لم يكن موجوداً
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS recruitment_applications (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        national_id TEXT,
        birth_date DATE,
        applied_role TEXT NOT NULL,
        education TEXT,
        military_status TEXT,
        address TEXT,
        expected_salary TEXT,
        experience_years TEXT,
        notes TEXT,
        status TEXT DEFAULT 'PENDING',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      INSERT INTO recruitment_applications (
        full_name, phone, national_id, birth_date,
        applied_role, education, military_status,
        address, expected_salary, experience_years,
        notes, status, created_at
      ) VALUES (
        ${fullName}, ${phone}, ${nationalId || null},
        ${birthDate ? sql`${birthDate}::date` : null},
        ${appliedRole || 'أخرى'}, ${education || null},
        ${militaryStatus || null}, ${address || null},
        ${expectedSalary || null}, ${experienceYears || null},
        ${notes || null}, 'PENDING', NOW()
      );
    `);

    return NextResponse.json({ success: true, message: 'تم إرسال طلب التوظيف بنجاح' });
  } catch (error: any) {
    console.error('Recruitment POST error:', error);
    return NextResponse.json({ message: error?.message || 'فشل إرسال الطلب' }, { status: 500 });
  }
}
