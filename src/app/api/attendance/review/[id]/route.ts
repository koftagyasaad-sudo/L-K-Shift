import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  context: { params?: Promise<{ id?: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    // 1. جلب سجلات البصمات بأمان تام بدون التوقف على أسماء الأعمدة
    let logs: any[] = [];
    try {
      const rawLogs = await db.execute(sql`SELECT * FROM attendance_logs ORDER BY id DESC;`);
      logs = Array.isArray(rawLogs) ? rawLogs : (rawLogs as any)?.rows || [];
    } catch {
      try {
        const rawFallback = await db.execute(sql`SELECT * FROM attendance ORDER BY id DESC;`);
        logs = Array.isArray(rawFallback) ? rawFallback : (rawFallback as any)?.rows || [];
      } catch (e) {
        console.error('No attendance logs table found:', e);
      }
    }

    // 2. جلب جدول المستخدمين
    let usersList: any[] = [];
    try {
      const rawUsers = await db.execute(sql`SELECT * FROM users;`);
      usersList = Array.isArray(rawUsers) ? rawUsers : (rawUsers as any)?.rows || [];
    } catch (e) {
      console.error('Users table query error:', e);
    }

    // 3. جلب جدول الفروع
    let branchesList: any[] = [];
    try {
      const rawBranches = await db.execute(sql`SELECT * FROM branches;`);
      branchesList = Array.isArray(rawBranches) ? rawBranches : (rawBranches as any)?.rows || [];
    } catch (e) {
      console.error('Branches table query error:', e);
    }

    // بناء جداول بحث سريعة لربط البيانات
    const userMap = new Map();
    usersList.forEach((u) => {
      if (u.id) userMap.set(String(u.id), u);
    });

    const branchMap = new Map();
    branchesList.forEach((b) => {
      if (b.id) branchMap.set(String(b.id), b);
    });

    // الدمج البرمجي الذكي المقاوم للأخطاء
    const formatted = logs.map((l: any) => {
      const uid = String(l.user_id || l.userId || '');
      const u = userMap.get(uid) || {};

      const bid = String(l.branch_id || l.branchId || u.primary_branch_id || u.branch_id || u.branchId || '');
      const b = branchMap.get(bid) || {};

      // استخراج الاسم والكود بمرونة لأي مسمى عمود
      const userName =
        u.full_name_ar ||
        u.fullNameAr ||
        u.name ||
        u.full_name ||
        l.user_name ||
        'موظف';

      const employeeCode =
        u.employee_number ||
        u.employee_code ||
        u.employeeCode ||
        u.employeeNumber ||
        (u.id ? String(u.id).padStart(3, '0') : '001');

      const branchName =
        b.name_ar ||
        b.nameAr ||
        b.name ||
        b.name_en ||
        'الفرع الرئيسي';

      // استخراج تاريخ الوردية
      let workDate = '';
      if (l.work_date) {
        workDate = String(l.work_date).slice(0, 10);
      } else if (l.check_in_time) {
        try {
          workDate = new Date(l.check_in_time).toISOString().slice(0, 10);
        } catch {
          workDate = new Date().toISOString().slice(0, 10);
        }
      } else {
        workDate = new Date().toISOString().slice(0, 10);
      }

      return {
        id: l.id,
        userId: l.user_id || l.userId || u.id || 0,
        userName,
        employeeCode,
        userPhone: u.phone || l.user_phone || '',
        branchName,
        workDate,
        checkInTime: l.check_in_time || l.checkInTime || null,
        checkOutTime: l.check_out_time || l.checkOutTime || null,
        gpsDistance: Number(l.check_in_distance || l.gps_distance || l.distance || 0),
        photoUrl: l.check_in_photo_url || l.photo_url || l.photoUrl || '',
        workedMinutes: Number(l.actual_worked_minutes || l.worked_minutes || l.workedMinutes || 0),
        lateMinutes: Number(l.late_minutes || l.lateMinutes || 0),
        overtimeMinutes: Number(l.overtime_minutes || l.overtimeMinutes || 0),
        status: l.status || 'ON_TIME',
        basicSalary: Number(u.monthly_salary || u.basic_salary || u.salary || 5000),
        workingHoursPerDay: Number(u.working_hours_per_day || u.workingHoursPerDay || 8),
      };
    });

    // تصفية السجلات حسب الفلاتر
    let filtered = formatted;
    if (userId && userId !== 'ALL') {
      filtered = filtered.filter((r) => String(r.userId) === String(userId));
    }
    if (fromDate) {
      filtered = filtered.filter((r) => String(r.workDate) >= fromDate);
    }
    if (toDate) {
      filtered = filtered.filter((r) => String(r.workDate) <= toDate);
    }

    return NextResponse.json(filtered, { status: 200 });
  } catch (error: any) {
    console.error('Attendance review API error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
