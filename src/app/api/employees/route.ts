import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, branches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const data = await db
      .select({
        id: users.id,
        name: users.name,
        phone: users.phone,
        email: users.email,
        role: users.role,
        jobTitle: users.jobTitle,
        employeeCode: users.employeeCode,
        branchId: users.branchId,
        roleId: users.roleId,
        hourlyRate: users.hourlyRate,
        monthlySalary: users.monthlySalary,
        isActive: users.isActive,
        canUseAttendanceTerminal: users.canUseAttendanceTerminal,
        notes: users.notes,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        branchNameAr: branches.nameAr,
        branchNameEn: branches.nameEn,
      })
      .from(users)
      .leftJoin(branches, eq(users.branchId, branches.id))
      .orderBy(desc(users.createdAt));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET /api/employees error:", error);
    const message =
      error instanceof Error ? error.message : "حدث خطأ أثناء جلب الموظفين";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name =
      body.name ||
      body.fullNameAr ||
      body.fullNameEn ||
      body.fullName ||
      "";
    const phone = body.phone ? String(body.phone).trim() : "";
    const email = body.email ? String(body.email).trim() : null;
    const rawPassword =
      body.password && String(body.password).trim().length > 0
        ? String(body.password).trim()
        : "123456";

    if (!name.trim()) {
      return NextResponse.json(
        { success: false, error: "اسم الموظف مطلوب" },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "رقم الهاتف مطلوب (اسم الدخول)" },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const existingPhone = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    if (existingPhone.length > 0) {
      return NextResponse.json(
        { success: false, error: "رقم الهاتف مسجل لموظف آخر بالفعل" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const userId = crypto.randomUUID();

    const branchId = body.branchId || body.branch_id || null;
    const roleId = body.roleId || body.role_id || null;
    const role = body.role ? String(body.role).trim() : "employee";
    const jobTitle = body.jobTitle || body.job_title || null;
    const employeeCode = body.employeeCode || body.employee_code || null;
    const hourlyRate =
      body.hourlyRate !== undefined && body.hourlyRate !== null
        ? String(body.hourlyRate)
        : body.hourly_rate !== undefined && body.hourly_rate !== null
        ? String(body.hourly_rate)
        : null;
    const monthlySalary =
      body.monthlySalary !== undefined && body.monthlySalary !== null
        ? String(body.monthlySalary)
        : body.monthly_salary !== undefined && body.monthly_salary !== null
        ? String(body.monthly_salary)
        : null;
    const isActive =
      body.isActive !== undefined
        ? Boolean(body.isActive)
        : body.is_active !== undefined
        ? Boolean(body.is_active)
        : true;
    const canUseAttendanceTerminal =
      body.canUseAttendanceTerminal !== undefined
        ? Boolean(body.canUseAttendanceTerminal)
        : body.can_use_attendance_terminal !== undefined
        ? Boolean(body.can_use_attendance_terminal)
        : true;
    const notes = body.notes ? String(body.notes).trim() : null;

    const [createdUser] = await db
      .insert(users)
      .values({
        id: userId,
        name: name.trim(),
        phone,
        email,
        password: hashedPassword,
        role,
        jobTitle,
        employeeCode,
        branchId,
        roleId,
        hourlyRate,
        monthlySalary,
        isActive,
        canUseAttendanceTerminal,
        notes,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "تم إنشاء الموظف بنجاح",
      data: createdUser,
    });
  } catch (error) {
    console.error("POST /api/employees error:", error);
    const message =
      error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء الموظف";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
