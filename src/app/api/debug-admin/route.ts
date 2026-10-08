import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { db } from "@/db";
import { users, branches } from "@/db/schema";
import { eq } from "drizzle-orm";

const DEBUG_KEY = "lk-debug-2024";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (key !== DEBUG_KEY) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const allAdmins = await db
      .select()
      .from(users)
      .where(eq(users.phone, "admin"));

    if (allAdmins.length === 0) {
      return NextResponse.json({
        found: false,
        message: "❌ لا يوجد أي مستخدم برقم هاتف 'admin' في قاعدة البيانات خالص",
      });
    }

    const admin = allAdmins[0];
    const passwordMatches = await compare("123", admin.passwordHash);

    const allBranches = await db.select().from(branches);

    return NextResponse.json({
      found: true,
      totalUsersWithThisPhone: allAdmins.length,
      user: {
        id: admin.id,
        phone: admin.phone,
        fullNameAr: admin.fullNameAr,
        systemRole: admin.systemRole,
        isActive: admin.isActive,
        primaryBranchId: admin.primaryBranchId,
        passwordHashPrefix: admin.passwordHash.substring(0, 10) + "...",
      },
      passwordTestResult: passwordMatches
        ? "✅ كلمة المرور '123' تطابق الهاش المخزن"
        : "❌ كلمة المرور '123' لا تطابق الهاش المخزن إطلاقًا",
      branchesCount: allBranches.length,
      diagnosis: !admin.isActive
        ? "🔴 المشكلة: الحساب غير نشط (isActive = false)"
        : !passwordMatches
          ? "🔴 المشكلة: كلمة المرور غير متطابقة"
          : "🟢 كل البيانات سليمة، المشكلة قد تكون في AUTH_SECRET أو إعدادات أخرى",
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
