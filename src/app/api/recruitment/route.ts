import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// 1. استرجاع طلبات التوظيف واستمارات المتقدمين
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view'); // 'APPLICATIONS' أو 'MANPOWER_REQUESTS'

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

    // افتراضياً: جلب استمارات المتقدمين
    const rawApps = await db.execute(sql`
      SELECT 
        id, full_name as "fullName", phone, age, city,
        military_status as "militaryStatus", job_title as "jobTitle",
        preferred_branch_name as "preferredBranchName", cv_url as "cvUrl",
        status, hr_notes as "hrNotes", created_at as "createdAt"
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

// 2. إرسال استمارة تقديم وظيفة عامة (بدون تسجيل دخول)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action; // 'APPLY' (عامة) أو 'REQUEST_MANPOWER' (داخلية لمدير الفرع)

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

      return NextResponse.json({ success: true, message: 'تم إرسال طلب نواقص العمالة لإدارة الـ HR' }, { status: 201 });
    }

    // استمارة التقديم العامة للوظائف
    const fullName = (body.fullName || '').toString().trim();
    const phone = (body.phone || '').toString().trim();
    const age = parseInt(String(body.age || '22'), 10);
    const city = body.city || '';
    const militaryStatus = body.militaryStatus || 'تم التأدية';
    const jobTitle = body.jobTitle || 'عضو فريق';
    const preferredBranchName = body.preferredBranchName || 'أقرب فرع';
    const cvUrl = body.cvUrl || null;

    if (!fullName || !phone) {
      return NextResponse.json({ message: 'الاسم ورقم الهاتف حقول مطلوبة' }, { status: 400 });
    }

    await db.execute(sql`
      INSERT INTO job_applications (
        full_name, phone, age, city, military_status, job_title, preferred_branch_name, cv_url, status, created_at
      ) VALUES (
        ${fullName}, ${phone}, ${age}, ${city}, ${militaryStatus}, ${jobTitle}, ${preferredBranchName}, ${cvUrl}, 'NEW', NOW()
      );
    `);

    return NextResponse.json({ success: true, message: 'تم استلام طلب توظيفك بنجاح! سيتواصل معك قسم الموارد البشرية.' }, { status: 201 });
  } catch (error: any) {
    console.error('Recruitment POST error:', error);
    return NextResponse.json({ message: error?.message || 'فشل إرسال الطلب', error: error?.message }, { status: 500 });
  }
}
