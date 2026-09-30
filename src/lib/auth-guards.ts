import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireSession(locale: string) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  return session;
}

export async function requireSuperAdmin(locale: string) {
  const session = await requireSession(locale);

  if (session.user.systemRole !== "SUPER_ADMIN") {
    redirect(`/${locale}`);
  }

  return session;
}
