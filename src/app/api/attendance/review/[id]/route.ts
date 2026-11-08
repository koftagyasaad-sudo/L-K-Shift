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

    // 1. جلب كافة سجلات الحركات
    let logsA: any[] = [];
    try {
      const rawA = await db.execute(sql`SELECT * FROM attendance_logs;`);
      logsA = Array.isArray(rawA) ? rawA : (rawA as any)?.rows || [];
    } catch {}

    let logsB: any[] = [];
    try {
      const rawB = await db.execute(sql`SELECT * FROM attendance;`);
      logsB = Array.isArray(rawB) ? rawB : (rawB as any)?.rows || [];
    } catch {}

    const allLogsMap = new Map();
    logsB.forEach((l) => {
      const key = `${l.user_id || l.userId}_${l.check_in_time || l.work_date}_${l.id}`;
      allLogsMap.set(key, l);
    });
    logsA.forEach((l) => {
      const key = `${l.user_id || l.userId}_${l.check_in_time || l.work_date}_${l.id}`;
      allLogsMap.set(key, l);
    });
    const combinedLogs = Array.from(allLogsMap.values());

    // 2. جلب بيانات الموظفين، الفروع، والإجازات والسلف
    let usersList: any[] = [];
    try {
      const rawUsers = await db.execute(sql`SELECT * FROM users;`);
      usersList = Array.isArray(rawUsers) ? rawUsers : (rawUsers as any)?.rows || [];
    } catch {}

    let branchesList: any[] = [];
    try {
      const rawBranches = await db.execute(sql`SELECT * FROM branches;`);
      branchesList = Array.isArray(rawBranches) ? rawBranches : (rawBranches as any)?.rows || [];
    } catch {}

    let leavesList: any[] = [];
    try {
      const rawLeaves = await db.execute(sql`
        SELECT * FROM leave_requests 
        WHERE status = 'APPROVED' OR final_status = 'APPROVED';
      `);
      leavesList = Array.isArray(rawLeaves) ? rawLeaves : (rawLeaves as any)?.rows || [];
    } catch {}

    const userMap = new Map();
    usersList.forEach((u) => userMap.set(String(u.id), u));

    const branchMap = new Map();
    branchesList.forEach((b) => branchMap.set(String(b.id), b));

    // 3. بناء وتنسيق سجلات الحركات الفردية
    const formatted = combinedLogs.map((l: any) => {
      const uid = String(l.user_id || l.userId || '');
      const u = userMap.get(uid) || {};
      const bid = String(l.branch_id || l.branchId || u.primary_branch_id || u.branch_id || '');
      const b = branchMap.get(bid) || {};

      const userName = u.full_name_ar || u.fullNameAr || u.name || l.user_name || 'موظف';
      const employeeCode =
        u.employee_number || u.employee_code || (u.id ? String(u.id).padStart(3, '0') : '001');
      const branchName = b.name_ar || b.name || 'الفرع الرئيسي';

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

      // القواعد المحاسبية الثابتة (الشهر محسوب ثابتاً على 30 يوماً)
      const basicSalary = Number(u.monthly_salary || 5000);
      const hoursPerDay = Number(u.working_hours_per_day || 8);
      const FIXED_MONTH_DAYS = 30; // حساب الشهر دائماً على 30 يوماً
      const dailyRate = basicSalary / FIXED_MONTH_DAYS;
      const hourlyRate = dailyRate / hoursPerDay;
      const minuteRate = hourlyRate / 60;

      const workedMinutes = Number(l.actual_worked_minutes || l.worked_minutes || 0);
      const lateMinutes = Number(l.late_minutes || 0);
      const overtimeMinutes = Number(l.overtime_minutes || 0);

      // السلف الخاصة بالموظف
      const empAdvances = leavesList
        .filter((lv: any) => String(lv.user_id) === uid && lv.request_type === 'ADVANCE')
        .reduce((sum: number, lv: any) => sum + (parseFloat(lv.advance_amount) || 0), 0);

      return {
        id: l.id,
        userId: l.user_id || l.userId || u.id || 0,
        userName,
        employeeCode,
        userPhone: u.phone || '',
        branchName,
        workDate,
        checkInTime: l.check_in_time || l.checkInTime || null,
        checkOutTime: l.check_out_time || l.checkOutTime || null,
        gpsDistance: Number(l.check_in_distance || l.gps_distance || 0),
        photoUrl: l.check_in_photo_url || l.photo_url || '',
        workedMinutes,
        lateMinutes,
        overtimeMinutes,
        status: l.status || 'ON_TIME',
        basicSalary,
        workingHoursPerDay: hoursPerDay,
        dailyRate: Number(dailyRate.toFixed(2)),
        hourlyRate: Number(hourlyRate.toFixed(2)),
        lateDeduction: Number((lateMinutes * minuteRate).toFixed(2)),
        overtimeBonus: Number((overtimeMinutes * minuteRate * 1.5).toFixed(2)),
        totalAdvances: empAdvances,
      };
    });

    formatted.sort((a, b) => {
      const timeA = new Date(a.checkInTime || a.workDate).getTime();
      const timeB = new Date(b.checkInTime || b.workDate).getTime();
      return timeB - timeA;
    });

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
