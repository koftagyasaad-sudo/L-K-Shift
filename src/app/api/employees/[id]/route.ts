import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, adminBranchScopes } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const employeeId = String(id);

    if (!employeeId || employeeId.trim() === "") {
      return NextResponse.json(
        { success: false, error: "معرف الموظف مطلوب" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, employeeId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "الموظف غير موجود بالنظام" },
        { status: 404 }
      );
    }

    const scopes = await db
      .select()
      .from(adminBranchScopes)
      .where(eq(adminBranchScopes.userId, user.id));

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        adminBranchScopes: scopes,
      },
    });
  } catch (error) {
    console.error("GET employee by ID API error:", error);
    const message =
      error instanceof Error ? error.message : "حدث خطأ أثناء جلب بيانات الموظف";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const employeeId = String(id);

    if (!employeeId || employeeId.trim() === "") {
      return NextResponse.json(
        { success: false, error: "معرف الموظف مطلوب" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      name,
      phone,
      email,
      password,
      role,
      jobTitle,
      job_title,
      employeeCode,
      employee_code,
      branchId,
      branch_id,
      roleId,
      role_id,
      hourlyRate,
      hourly_rate,
      monthlySalary,
      monthly_salary,
      isActive,
      is_active,
      canUseAttendanceTerminal,
      can_use_attendance_terminal,
      notes,
    } = body;

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, employeeId))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "الموظف غير موجود بالنظام" },
        { status: 404 }
      );
    }

    const targetBranchId = branchId || branch_id || existingUser.branchId;
    const targetRoleId = roleId || role_id || existingUser.roleId;
    const targetJobTitle = jobTitle || job_title || existingUser.jobTitle;
    const targetEmployeeCode = employeeCode || employee_code || existingUser.employeeCode;
    const targetHourlyRate =
      hourlyRate !== undefined
        ? hourlyRate
        : hourly_rate !== undefined
        ? hourly_rate
        : existingUser.hourlyRate;
    const targetMonthlySalary =
      monthlySalary !== undefined
        ? monthlySalary
        : monthly_salary !== undefined
        ? monthly_salary
        : existingUser.monthlySalary;
    const targetIsActive =
      isActive !== undefined
        ? Boolean(isActive)
        : is_active !== undefined
        ? Boolean(is_active)
        : existingUser.isActive;
    const targetCanTerminal =
      canUseAttendanceTerminal !== undefined
        ? Boolean(canUseAttendanceTerminal)
        : can_use_attendance_terminal !== undefined
        ? Boolean(can_use_attendance_terminal)
        : existingUser.canUseAttendanceTerminal;

    const updateData: Record<string, unknown> = {
      name: name ? String(name).trim() : existingUser.name,
      phone: phone ? String(phone).trim() : existingUser.phone,
      email: email !== undefined ? (email ? String(email).trim() : null) : existingUser.email,
      role: role ? String(role).trim() : existingUser.role,
      jobTitle: targetJobTitle ? String(targetJobTitle).trim() : null,
      employeeCode: targetEmployeeCode ? String(targetEmployeeCode).trim() : null,
      branchId: targetBranchId ? String(targetBranchId).trim() : null,
      roleId: targetRoleId ? String(targetRoleId).trim() : null,
      hourlyRate: targetHourlyRate !== null && targetHourlyRate !== undefined ? String(targetHourlyRate) : null,
      monthlySalary: targetMonthlySalary !== null && targetMonthlySalary !== undefined ? String(targetMonthlySalary) : null,
      isActive: targetIsActive,
      canUseAttendanceTerminal: targetCanTerminal,
      notes: notes !== undefined ? (notes ? String(notes).trim() : null) : existingUser.notes,
      updatedAt: new Date(),
    };

    if (password && String(password).trim().length > 0) {
      updateData.password = await bcrypt.hash(String(password).trim(), 10);
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, employeeId))
      .returning();

    return NextResponse.json({
      success: true,
      message: "تم تحديث بيانات الموظف بنجاح",
      data: updatedUser,
    });
  } catch (error) {
    console.error("PUT employee by ID API error:", error);
    const message =
      error instanceof Error ? error.message : "حدث خطأ أثناء تحديث بيانات الموظف";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: RouteParams) {
  return PUT(req, context);
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const employeeId = String(id);

    if (!employeeId || employeeId.trim() === "") {
      return NextResponse.json(
        { success: false, error: "معرف الموظف مطلوب" },
        { status: 400 }
      );
    }

    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, employeeId))
      .returning();

    if (!deletedUser) {
      return NextResponse.json(
        { success: false, error: "الموظف غير موجود بالنظام" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "تم حذف الموظف بنجاح",
      data: deletedUser,
    });
  } catch (error) {
    console.error("DELETE employee by ID API error:", error);
    const message =
      error instanceof Error ? error.message : "حدث خطأ أثناء حذف الموظف";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
