import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// 1. استرجاع طلبات التوظيف واستمارات المتقدمين
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');

    if (view === 'MANPOWER_REQUESTS') {
      const raw = await db.execute(sql`
        SELECT 
          id, branch_id as "branchId", branch_name as "branchName",
          requested_by_name as "requestedByName", job_title as "jobTitle",
          quantity, urgency, reason, status, admin_notes as "adminNotes",
          created_at as "createdAt"
        FROM manpower_requests
        ORDER BY created_at DESC;
      `);
      const rows = Array.isArray(raw) ? raw : (raw as any)?.rows || [];
      return NextResponse.json(rows, { status: 200 });
    }

    const rawApps = await db.execute(sql`
      SELECT 
        id, 
        full_name as "fullName", 
        phone, 
        age, 
        birth_date::text as "birthDate",
        city,
        military_status as "militaryStatus", 
        job_title as "jobTitle",
        expected_salary as "expectedSalary",
        skills_courses as "skillsCourses",
        experience_notes as "experienceNotes",
        preferred_branch_name as "preferredBranchName", 
        cv_url as "cvUrl",
        status, 
        hr_notes as "hrNotes", 
        created_at as "createdAt"
      FROM job_applications
      ORDER BY created_at DESC;
    `);

    const apps = Array.isArray(rawApps) ? rawApps : (rawApps as any)?.rows || [];
    return NextResponse.json(apps, { status: 200 });
  } catch (error: any) {
    console.error('Recruitment GET error:', error);
    return NextResponse.json({ message: 'فشل استرجاع البيانات', error: error?.message }, { status: 500 });
  }
}

// 2. استقبال وحفظ استمارة التقديم مع الحقول الجديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === 'REQUEST_MANPOWER') {
      const branchId = parseInt(String(body.branchId), 10);
      const branchName = body.branchName || 'فرع';
      const requestedByName = body.requestedByName || 'مدير الفرع';
      const jobTitle = body.jobTitle;
      const quantity = parseInt(String(body.quantity || '1'), 10);
      const urgency = body.urgency || 'NORMAL';
      const reason = body.reason || '';

      if (!jobTitle || !reason) {
        return NextResponse.json({ message: 'المسمى الوظيفي وسبب طلب العمالة حقول مطلوبة' }, { status: 400 });
      }

      await db.execute(sql`
        INSERT INTO manpower_requests (
          branch_id, branch_name, requested_by_name, job_title, quantity, urgency, reason, status, created_at
        ) VALUES (
          ${branchId}, ${branchName}, ${requestedByName}, ${jobTitle}, ${quantity}, ${urgency}, ${reason}, 'PENDING', NOW()
        );
      `);

      return NextResponse.json({ success: true, message: 'تم إرسال طلب عجز العمالة بنجاح' }, { status: 201 });
    }

    // استمارة التقديم العامة
    const fullName = (body.fullName || '').toString().trim();
    const phone = (body.phone || '').toString().trim();
    const age = parseInt(String(body.age || '22'), 10);
    const birthDate = body.birthDate || null;
    const city = (body.city || '').toString().trim();
    const militaryStatus = body.militaryStatus || 'تم التأدية';
    const jobTitle = (body.jobTitle || 'عضو فريق').toString().trim();
    const expectedSalary = body.expectedSalary ? parseFloat(String(body.expectedSalary)) : null;
    const skillsCourses = (body.skillsCourses || '').toString().trim();
    const experienceNotes = (body.experienceNotes || '').toString().trim();
    const cvUrl = body.cvUrl || null;

    if (!fullName || !phone || !jobTitle) {
      return NextResponse.json({ message: 'الاسم، رقم الهاتف، والوظيفة المطلوبة حقول إلزامية' }, { status: 400 });
    }

    await db.execute(sql`
      INSERT INTO job_applications (
        full_name, 
        phone, 
        age, 
        birth_date,
        city, 
        military_status, 
        job_title, 
        expected_salary,
        skills_courses,
        experience_notes,
        cv_url, 
        status, 
        created_at
      ) VALUES (
        ${fullName}, 
        ${phone}, 
        ${age}, 
        ${birthDate ? sql`${birthDate}::date` : null},
        ${city}, 
        ${militaryStatus}, 
        ${jobTitle}, 
        ${expectedSalary},
        ${skillsCourses},
        ${experienceNotes},
        ${cvUrl}, 
        'NEW', 
        NOW()
      );
    `);

    return NextResponse.json({ success: true, message: 'تم استلام طلب توظيفك بنجاح! سيتواصل معك قسم الموارد البشرية.' }, { status: 201 });
  } catch (error: any) {
    console.error('Recruitment POST error:', error);
    return NextResponse.json({ message: error?.message || 'فشل إرسال الطلب', error: error?.message }, { status: 500 });
  }
}
