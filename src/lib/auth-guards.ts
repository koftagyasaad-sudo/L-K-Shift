import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireSession(locale: string) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect(`/${locale}/login`);
  }

  return session;
}

export async function requireSuperAdmin(locale: string) {
  const session = await requireSession(locale);

  const userRole = (session.user as any)?.systemRole || (session.user as any)?.role;

  if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
    redirect(`/${locale}`);
  }

  return session;
}
