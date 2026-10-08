import React from "react";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "@/i18n/navigation";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect({ href: "/login", locale });
    return null;
  }

  // التحقق من وجود المستخدم في قاعدة البيانات بأمان تام دون الاعتماد على أعمدة غير موجودة
  const [currentUser] = await db
    .select({
      id: users.id,
      name: users.name,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, Number(session.user.id)))
    .limit(1);

  if (!currentUser || !currentUser.isActive) {
    redirect({ href: "/login", locale });
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}
