// src/app/api/admin/debug-auth/route.ts
import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const phone = searchParams.get("phone")?.trim() ?? "";
  const password = searchParams.get("password") ?? "";

  if (!process.env.DB_RESET_TOKEN || token !== process.env.DB_RESET_TOKEN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const diagnosis: Record<string, unknown> = {
    env_check: {
      AUTH_SECRET_exists: Boolean(process.env.AUTH_SECRET),
      DATABASE_URL_exists: Boolean(process.env.DATABASE_URL),
      DB_RESET_TOKEN_exists: Boolean(process.env.DB_RESET_TOKEN),
    },
  };

  try {
    const allUsers = await db
      .select({ id: users.id, phone: users.phone, isActive: users.isActive, systemRole: users.systemRole })
      .from(users);

    diagnosis.total_users_in_db = allUsers.length;
    diagnosis.all_phones_in_db = allUsers.map((u) => ({
      phone: u.phone,
      isActive: u.isActive,
      systemRole: u.systemRole,
    }));

    if (!phone) {
      diagnosis.note = "لم يتم إرسال phone للفحص. أضف ?phone=admin&password=123 للرابط";
      return NextResponse.json(diagnosis);
    }

    const record = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    const user = record[0];

    diagnosis.searched_phone = phone;
    diagnosis.user_found = Boolean(user);

    if (!user) {
      diagnosis.conclusion = `لا يوجد مستخدم برقم "${phone}" في قاعدة البيانات`;
      return NextResponse.json(diagnosis);
    }

    diagnosis.user_isActive = user.isActive;
    diagnosis.user_systemRole = user.systemRole;
    diagnosis.password_hash_length = user.passwordHash?.length ?? 0;

    if (password) {
      const isValid = await compare(password, user.passwordHash);
      diagnosis.password_match = isValid;
      diagnosis.conclusion = isValid
        ? "✅ كل شيء صحيح! البيانات متطابقة تمامًا."
        : "❌ كلمة المرور غير متطابقة مع الهاش المخزن في قاعدة البيانات.";
    } else {
      diagnosis.note = "أضف &password=123 للرابط لفحص تطابق كلمة المرور";
    }

    return NextResponse.json(diagnosis);
  } catch (error) {
    diagnosis.database_error = String(error);
    return NextResponse.json(diagnosis, { status: 500 });
  }
}
