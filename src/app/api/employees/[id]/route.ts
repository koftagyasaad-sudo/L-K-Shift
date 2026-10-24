import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, branches, roles, adminBranchScopes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const employeeId = resolvedParams.id;

    if (!employeeId) {
      return NextResponse.json({ error: 'معرف الموظف مطلوب' }, { status: 400 });
    }

    const userRecords = await db
      .select({
        id: users.id,
        phone: users.phone,
        name: users.name,
        fullNameAr: users.fullNameAr,
        fullNameEn: users.fullNameEn,
        email: users.email,
        role: users.role,
        systemRole: users.systemRole,
        jobTitle: users.jobTitle,
        employeeCode: users.employeeCode,
        hourlyRate: users.hourlyRate,
        monthlySalary: users.monthlySalary,
        canUseAttendanceTerminal: users.canUseAttendanceTerminal,
        branchId: users.branchId,
        primaryBranchId: users.primaryBranchId,
        roleId: users.roleId,
        isActive: users.isActive,
        notes: users.notes,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        branchName: branches.name,
        roleName: roles.name,
      })
      .from(users)
      .leftJoin(branches, eq(users.branchId, branches.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, employeeId))
      .limit(1);

    if (!userRecords || userRecords.length === 0) {
      return NextResponse.json({ error: 'لم يتم العثور على الموظف' }, { status: 404 });
    }

    const scopes = await db
      .select({ branchId: adminBranchScopes.branchId })
      .from(adminBranchScopes)
      .where(eq(adminBranchScopes.userId, employeeId));

    const branchScopes = scopes.map((s) => String(s.branchId));

    return NextResponse.json({
      success: true,
      data: {
        ...userRecords[0],
        branchScopes,
      },
    });
  } catch (error: any) {
    console.error('Error fetching employee details:', error);
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء جلب بيانات الموظف' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return PATCH(request, context);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const employeeId = resolvedParams.id;

    if (!employeeId) {
      return NextResponse.json({ error: 'معرف الموظف مطلوب' }, { status: 400 });
    }

    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, employeeId))
      .limit(1);

    if (!existingUsers || existingUsers.length === 0) {
      return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 });
    }

    const existingUser = existingUsers[0];
    const body = await request.json();

    const {
      phone,
      password,
      name,
      fullNameAr,
      fullNameEn,
      email,
      role,
      systemRole,
      jobTitle,
      employeeCode,
      hourlyRate,
      monthlySalary,
      canUseAttendanceTerminal,
      can_use_attendance_terminal,
      branchId,
      primaryBranchId,
      roleId,
      isActive,
      notes,
      branchScopes,
    } = body;

    const resolvedName = fullNameAr || name || existingUser.fullNameAr || existingUser.name || 'موظف';
    const resolvedBranchId = branchId || primaryBranchId || existingUser.branchId || existingUser.primaryBranchId || null;
    const resolvedCanUseTerminal = canUseAttendanceTerminal !== undefined 
      ? Boolean(canUseAttendanceTerminal) 
      : can_use_attendance_terminal !== undefined 
      ? Boolean(can_use_attendance_terminal) 
      : Boolean(existingUser.canUseAttendanceTerminal ?? true);

    const updateData: Record<string, any> = {
      phone: phone ? String(phone).trim() : existingUser.phone,
      name: resolvedName,
      fullNameAr: resolvedName,
      fullNameEn: fullNameEn !== undefined ? (fullNameEn ? String(fullNameEn).trim() : null) : existingUser.fullNameEn,
      email: email !== undefined ? (email ? String(email).trim() : null) : existingUser.email,
      role: role ? String(role) : existingUser.role,
      systemRole: systemRole ? String(systemRole) : (role ? String(role) : existingUser.systemRole),
      jobTitle: jobTitle !== undefined ? (jobTitle ? String(jobTitle).trim() : null) : existingUser.jobTitle,
      employeeCode: employeeCode !== undefined ? (employeeCode ? String(employeeCode).trim() : null) : existingUser.employeeCode,
      hourlyRate: hourlyRate !== undefined ? (hourlyRate !== null ? Number(hourlyRate) : null) : existingUser.hourlyRate,
      monthlySalary: monthlySalary !== undefined ? (monthlySalary !== null ? Number(monthlySalary) : null) : existingUser.monthlySalary,
      canUseAttendanceTerminal: resolvedCanUseTerminal,
      branchId: resolvedBranchId,
      primaryBranchId: resolvedBranchId,
      roleId: roleId !== undefined ? (roleId ? String(roleId) : null) : existingUser.roleId,
      isActive: isActive !== undefined ? Boolean(isActive) : existingUser.isActive,
      notes: notes !== undefined ? (notes ? String(notes) : null) : existingUser.notes,
      updatedAt: new Date(),
    };

    if (password && String(password).trim() !== '') {
      updateData.password = await bcrypt.hash(String(password).trim(), 10);
    }

    await db.update(users).set(updateData).where(eq(users.id, employeeId));

    if (Array.isArray(branchScopes)) {
      await db.delete(adminBranchScopes).where(eq(adminBranchScopes.userId, employeeId));
      if (branchScopes.length > 0) {
        const scopeValues = branchScopes.map((bId: string) => ({
          userId: employeeId,
          branchId: String(bId),
          createdAt: new Date(),
        }));
        await db.insert(adminBranchScopes).values(scopeValues);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم تحديث بيانات الموظف بنجاح',
      id: employeeId,
    });
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء تحديث بيانات الموظف' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const employeeId = resolvedParams.id;

    if (!employeeId) {
      return NextResponse.json({ error: 'معرف الموظف مطلوب' }, { status: 400 });
    }

    await db.delete(users).where(eq(users.id, employeeId));

    return NextResponse.json({
      success: true,
      message: 'تم حذف الموظف بنجاح',
    });
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء حذف الموظف' },
      { status: 500 }
    );
  }
}
