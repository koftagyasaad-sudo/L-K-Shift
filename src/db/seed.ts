// src/db/seed.ts
import { hash } from "bcryptjs";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  adminBranchScopes,
  attendanceLogs,
  auditLogs,
  branches,
  customRoleAssignments,
  customRoles,
  leaveRequests,
  notifications,
  shiftAssignments,
  shiftTemplates,
  userAllowedBranches,
  users,
} from "@/db/schema";

function addDays(base: Date, days: number) {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function atTime(date: Date, hour: number, minute = 0) {
  const result = new Date(date);
  result.setHours(hour, minute, 0, 0);
  return result;
}

function differenceInMinutes(start: Date, end: Date) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

export async function ensureSeedData() {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(824713)`);

    const existingUsers = await tx.select({ id: users.id }).from(users).limit(1);
    if (existingUsers.length > 0) {
      return;
    }

    const passwordAdmin = await hash("admin123", 10);
    const passwordEmployee = await hash("employee123", 10);

    const insertedBranches = await tx
      .insert(branches)
      .values([
        {
          nameAr: "ليون بروست - العليا",
          nameEn: "Lion Broast - Olaya",
          type: "BRANCH",
          address: "Olaya District, Riyadh",
          latitude: 24.7117,
          longitude: 46.6747,
          geofenceRadius: 120,
          qrSecretKey: "lion-broast-olaya-secret",
          qrRefreshSec: 60,
          wifiSsid: "LION-OLAYA-STAFF",
        },
        {
          nameAr: "كوفتاجي - الملز",
          nameEn: "Koftagi - Malaz",
          type: "BRANCH",
          address: "Al Malaz, Riyadh",
          latitude: 24.6663,
          longitude: 46.7373,
          geofenceRadius: 100,
          qrSecretKey: "koftagi-malaz-secret",
          qrRefreshSec: 60,
          wifiSsid: "KOFTAGI-MALAZ",
        },
        {
          nameAr: "ليون بروست - الصحافة",
          nameEn: "Lion Broast - Sahafa",
          type: "BRANCH",
          address: "As Sahafah, Riyadh",
          latitude: 24.7981,
          longitude: 46.6315,
          geofenceRadius: 100,
          qrSecretKey: "lion-broast-sahafa-secret",
          qrRefreshSec: 60,
          wifiSsid: "LION-SAHAFA",
        },
        {
          nameAr: "المطبخ المركزي",
          nameEn: "Central Kitchen",
          type: "CENTRAL_KITCHEN",
          address: "Industrial Area, Riyadh",
          latitude: 24.6171,
          longitude: 46.7719,
          geofenceRadius: 140,
          qrSecretKey: "central-kitchen-secret",
          qrRefreshSec: 60,
          wifiSsid: "LK-CENTRAL-KITCHEN",
        },
        {
          nameAr: "المقر الرئيسي",
          nameEn: "Headquarters",
          type: "HQ",
          address: "King Abdullah Road, Riyadh",
          latitude: 24.7447,
          longitude: 46.6988,
          geofenceRadius: 150,
          qrSecretKey: "hq-secret",
          qrRefreshSec: 60,
          wifiSsid: "LK-HQ",
        },
      ])
      .returning();

    const branchByName = Object.fromEntries(insertedBranches.map((branch) => [branch.nameEn, branch]));

    const insertedUsers = await tx
      .insert(users)
      .values([
        {
          fullNameAr: "مدير النظام",
          fullNameEn: "System Admin",
          phone: "0500000000",
          passwordHash: passwordAdmin,
          systemRole: "SUPER_ADMIN",
          jobRole: "HR Director",
          primaryBranchId: branchByName["Headquarters"].id,
          verificationMode: "MANUAL",
          hireDate: addDays(new Date(), -500),
          salaryType: "MONTHLY",
          monthlySalary: "18000.00",
        },
        {
          fullNameAr: "أحمد صالح",
          fullNameEn: "Ahmed Saleh",
          phone: "0501111111",
          passwordHash: passwordEmployee,
          systemRole: "EMPLOYEE",
          jobRole: "Cashier",
          primaryBranchId: branchByName["Lion Broast - Olaya"].id,
          verificationMode: "QR_GPS",
          hireDate: addDays(new Date(), -220),
          salaryType: "MONTHLY",
          monthlySalary: "5200.00",
        },
        {
          fullNameAr: "سارة محمود",
          fullNameEn: "Sara Mahmoud",
          phone: "0502222222",
          passwordHash: passwordEmployee,
          systemRole: "EMPLOYEE",
          jobRole: "Kitchen Supervisor",
          primaryBranchId: branchByName["Central Kitchen"].id,
          verificationMode: "GPS_ONLY",
          hireDate: addDays(new Date(), -320),
          salaryType: "MONTHLY",
          monthlySalary: "7600.00",
        },
      ])
      .returning();

    const adminUser = insertedUsers.find((user) => user.systemRole === "SUPER_ADMIN");
    const employeeUser = insertedUsers.find((user) => user.phone === "0501111111");
    const kitchenUser = insertedUsers.find((user) => user.phone === "0502222222");

    if (!adminUser || !employeeUser || !kitchenUser) {
      throw new Error("Seed users were not created correctly");
    }

    await tx.insert(userAllowedBranches).values([
      { userId: employeeUser.id, branchId: branchByName["Lion Broast - Olaya"].id },
      { userId: employeeUser.id, branchId: branchByName["Koftagi - Malaz"].id },
      { userId: kitchenUser.id, branchId: branchByName["Central Kitchen"].id },
    ]);

    await tx.insert(adminBranchScopes).values(insertedBranches.map((branch) => ({ userId: adminUser.id, branchId: branch.id })));

    const [morningShift] = await tx
      .insert(shiftTemplates)
      .values({
        nameAr: "الوردية الصباحية",
        nameEn: "Morning Shift",
        startTime: "09:00:00",
        endTime: "17:00:00",
        gracePeriodMinutes: 10,
        lateThresholdMinutes: 45,
        overtimeThresholdMin: 30,
      })
      .returning();

    const [roleRow] = await tx
      .insert(customRoles)
      .values({
        name: "branch-accountant",
        nameAr: "محاسب فرع",
        permissions: [
          "attendance.view",
          "attendance.export",
          "leaves.view",
          "reports.view",
          "employees.view",
        ],
        isSystem: false,
      })
      .returning();

    await tx.insert(customRoleAssignments).values({
      userId: adminUser.id,
      roleId: roleRow.id,
    });

    const today = startOfDay(new Date());
    const assignmentRows: Array<{ id: number; workDate: Date }> = [];

    for (let offset = -8; offset <= 0; offset += 1) {
      const workDate = startOfDay(addDays(today, offset));
      const [assignment] = await tx
        .insert(shiftAssignments)
        .values({
          userId: employeeUser.id,
          shiftId: morningShift.id,
          branchId: branchByName["Lion Broast - Olaya"].id,
          workDate,
          isDayOff: offset === -6,
          notes: offset === -6 ? "Weekly day off" : null,
        })
        .returning({ id: shiftAssignments.id, workDate: shiftAssignments.workDate });

      assignmentRows.push(assignment);
    }

    await tx.insert(attendanceLogs).values(
      assignmentRows.map((assignment, index) => {
        const isDayOff = index === 2;
        const lateDay = index === 4;
        const absentDay = index === 6;
        const incompleteDay = index === 8;

        if (isDayOff) {
          return {
            userId: employeeUser.id,
            shiftAssignmentId: assignment.id,
            branchId: branchByName["Lion Broast - Olaya"].id,
            workDate: assignment.workDate,
            status: "DAY_OFF" as const,
            notes: "Scheduled day off",
          };
        }

        if (absentDay) {
          return {
            userId: employeeUser.id,
            shiftAssignmentId: assignment.id,
            branchId: branchByName["Lion Broast - Olaya"].id,
            workDate: assignment.workDate,
            status: "ABSENT" as const,
            notes: "No check-in recorded",
          };
        }

        const checkIn = lateDay ? atTime(assignment.workDate, 9, 28) : atTime(assignment.workDate, 8, 57);
        const checkOut = incompleteDay ? null : atTime(assignment.workDate, 17, lateDay ? 20 : 31);
        const lateMinutes = lateDay ? 28 : 0;
        const workedMinutes = checkOut ? differenceInMinutes(checkIn, checkOut) : 0;
        const overtime = checkOut ? Math.max(0, differenceInMinutes(atTime(assignment.workDate, 17, 0), checkOut)) : 0;

        return {
          userId: employeeUser.id,
          shiftAssignmentId: assignment.id,
          branchId: branchByName["Lion Broast - Olaya"].id,
          workDate: assignment.workDate,
          checkInTime: checkIn,
          checkInLat: 24.7118,
          checkInLng: 46.6749,
          checkInDistance: 17.6,
          checkInMethod: "QR" as const,
          checkOutTime: checkOut,
          checkOutLat: checkOut ? 24.7119 : null,
          checkOutLng: checkOut ? 46.675 : null,
          checkOutDistance: checkOut ? 21.1 : null,
          checkOutMethod: checkOut ? ("GPS" as const) : null,
          status: 
