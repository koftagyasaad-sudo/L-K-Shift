import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { decode } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";

const JWT_SECRET =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  "lk-shift-super-secret-jwt-key-prod-2026";

export async function getResilientSessionUser(): Promise<{
  id?: string | null;
  phone?: string | null;
  name?: string | null;
  role?: string | null;
  systemRole?: string | null;
  branchId?: string | null;
} | null> {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      return session.user as {
        id?: string | null;
        phone?: string | null;
        name?: string | null;
        role?: string | null;
        systemRole?: string | null;
        branchId?: string | null;
      };
    }
  } catch {}

  try {
    const cookieStore = await cookies();
    const rawToken =
      cookieStore.get("__Secure-next-auth.session-token")?.value ||
      cookieStore.get("next-auth.session-token")?.value;
    if (!rawToken) return null;

    const decoded = await decode({ token: rawToken, secret: JWT_SECRET });
    if (!decoded) return null;

    return {
      id: (decoded.id as string) || (decoded.sub as string) || null,
      phone: (decoded.phone as string) || null,
      name: (decoded.name as string) || null,
      role: (decoded.role as string) || null,
      systemRole: (decoded.systemRole as string) || null,
      branchId: (decoded.branchId as string) || null,
    };
  } catch {
    return null;
  }
}
