// src/db/seed.ts
import { hash } from "bcryptjs";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { branches, notifications, users } from "@/db/schema";

/**
 * ينشئ الفروع الأساسية الأربعة فقط (مرة واحدة، لو الجدول فاضي).
 */
export async function ensureSeedData() {
  const existingBranches = await db.select({ id: branches.id }).from(branches).limit(1);
  if (existingBranches.length > 0) {
    return;
  }

  await db.insert(branches).values([
    {
      nameAr: "الإدارة",
      nameEn: "Management",
      type: "BRANCH",
      address: "كفر الشيخ، مصر",
      latitude: 31.1107,
      longitude: 30.9388,
      geofenceRadius: 150,
      qrSecretKey: "lk-management-secret",
      qrRefreshSec: 60,
      wifiSsid: "LK-MANAGEMENT",
    },
    {
      nameAr: "بروست الأسد",
      nameEn: "Lion Broast",
      type: "BRANCH",
      address: "كفر الشيخ، مصر",
      latitude: 31.1107,
      longitude: 30.9388,
      geofenceRadius: 100,
      qrSecretKey: "lion-broast-secret",
      qrRefreshSec: 60,
      wifiSsid: "LION-BROAST",
    },
    {
      nameAr: "الكفتجي - دسوق",
      nameEn: "Koftagi - Desouk",
      type: "BRANCH",
      address: "دسوق، كفر الشيخ، مصر",
      latitude: 31.1316,
      longitude: 30.644,
      geofenceRadius: 100,
      qrSecretKey: "koftagi-desouk-secret",
      qrRefreshSec: 60,
      wifiSsid: "KOFTAGI-DESOUK",
    },
    {
      nameAr: "الكفتجي - كفر الشيخ",
      nameEn: "Koftagi - Kafr El Sheikh",
      type: "BRANCH",
      address: "كفر الشيخ، مصر",
      latitude: 31.1107,
      longitude: 30.9388,
      geofenceRadius: 100,
      qrSecretKey: "koftagi-kafr-elsheikh-secret",
      qrRefreshSec: 60,
      wifiSsid: "KOFTAGI-KAFRELSHEIKH",
    },
  ]);
}

/**
 * يضمن وجود مستخدم الدخول الرئيسي:
 * phone: "admin" / password: "123" / صلاحية SUPER_ADMIN كاملة
 * مرتبط تلقائيًا بفرع "الإدارة".
 *
 * يدعم أيضًا ترحيل تلقائي: لو كان فيه يوزر قديم بـ phone = "010"،
 * يتم تحديث رقمه إلى "admin" تلقائيًا بدل إنشاء يوزر مكرر.
 */
export async function ensureDemoLoginUser() {
  const ADMIN_PHONE = "admin";
  const LEGACY_PHONE = "010";

  const existingAdmin = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.phone, ADMIN_PHONE))
    .limit(1);

  if (existingAdmin.length > 0) {
    return;
  }

  const legacyUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.phone, LEGACY_PHONE))
    .limit(1);

  if (legacyUser.length > 0) {
    await db
      .update(users)
      .set({
        phone: ADMIN_PHONE,
        fullNameAr: "المدير العام",
        fullNameEn: "Admin",
        jobRole: "System Administrator",
      })
      .where(eq(users.id, legacyUser[0].id));
    return;
  }

  const [managementBranch] = await db
    .select({ id: branches.id })
    .from(branches)
    .where(eq(branches.nameEn, "Management"))
    .limit(1);

  const passwordHash = await hash("123", 10);

  await db.insert(users).values({
    fullNameAr: "المدير العام",
    fullNameEn: "Admin",
    phone: ADMIN_PHONE,
    passwordHash,
    systemRole: "SUPER_ADMIN",
    jobRole: "System Administrator",
    primaryBranchId: managementBranch?.id ?? null,
    verificationMode: "MANUAL",
    hireDate: new Date(),
    salaryType: "MONTHLY",
    monthlySalary: "0.00",
  });
}

export async function getRecentNotifications(userId: number) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(8);
}

export async function getUnreadNotificationCount(userId: number) {
  const items = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  return items.length;
}
