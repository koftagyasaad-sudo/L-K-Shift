import { NextAuthOptions, User, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/passwords";

export type AppUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone: string;
  role: string;
  systemRole: any;
  fullNameAr?: string | null;
  fullNameEn?: string | null;
  branchId?: string | null;
  primaryBranchId?: string | null;
};

function toNullableString(val: any): string | null {
  if (val === undefined || val === null || val === "") return null;
  return String(val);
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 يوماً
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<AppUser | null> {
        try {
          const rawPhone = (credentials as any)?.phone || (credentials as any)?.username;
          if (!rawPhone || !credentials?.password) {
            console.warn("[AUTH] Missing credentials payload");
            return null;
          }

          const phone = String(rawPhone).trim();
          const password = String(credentials.password);

          const found = await db
            .select()
            .from(users)
            .where(eq(users.phone, phone))
            .limit(1);

          const user = found[0];
          if (!user) {
            console.warn(`[AUTH] User not found for phone: ${phone}`);
            return null;
          }

          const isActive = (user as any).isActive !== false && (user as any).active !== false;
          if (!isActive) {
            console.warn(`[AUTH] User account is inactive: ${phone}`);
            return null;
          }

          const passwordHash = user.passwordHash || (user as any).password;
          if (!passwordHash) {
            console.warn(`[AUTH] No password hash found for user: ${phone}`);
            return null;
          }

          const verification = await verifyPassword(password, passwordHash);
          if (!verification.isValid) {
            console.warn(`[AUTH] Password verification failed for: ${phone}`);
            return null;
          }

          if (verification.needsRehash) {
            try {
              await db
                .update(users)
                .set({ passwordHash: await hashPassword(password), updatedAt: new Date() })
                .where(eq(users.id, user.id));
            } catch (rehashErr) {
              console.error("[AUTH] Rehash update failed:", rehashErr);
            }
          }

          const role = (user as any).jobRole || (user as any).roleId || "SUPER_ADMIN";
          const systemRoleVal = (user as any).systemRole || "SUPER_ADMIN";
          const branchId = toNullableString((user as any).primaryBranchId || (user as any).branchId);
          const fullNameAr = toNullableString((user as any).fullNameAr || (user as any).name);
          const fullNameEn = toNullableString((user as any).fullNameEn);
          const displayName = fullNameAr || fullNameEn || (user as any).name || phone;

          const result: AppUser = {
            id: String(user.id),
            name: displayName,
            email: null,
            phone: user.phone || phone,
            role,
            systemRole: systemRoleVal as any,
            fullNameAr,
            fullNameEn,
            branchId,
            primaryBranchId: branchId,
          };

          return result;
        } catch (error: any) {
          console.error("[AUTH_CRITICAL_EXCEPTION]:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User | AppUser }) {
      if (user) {
        const u = user as AppUser;
        token.id = String(u.id);
        token.phone = String(u.phone || "");
        token.role = String(u.role || "SUPER_ADMIN");
        token.systemRole = (u.systemRole ?? u.role ?? "SUPER_ADMIN") as any;
        token.fullNameAr = u.fullNameAr ?? null;
        token.fullNameEn = u.fullNameEn ?? null;
        token.branchId = toNullableString(u.branchId);
        token.primaryBranchId = toNullableString(u.primaryBranchId ?? u.branchId);
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        const sUser = session.user as AppUser;
        sUser.id = String(token.id || sUser.id || "");
        sUser.phone = String(token.phone || sUser.phone || "");
        sUser.role = String(token.role || "SUPER_ADMIN");
        sUser.systemRole = (token.systemRole as any) || "SUPER_ADMIN";
        sUser.fullNameAr = toNullableString(token.fullNameAr);
        sUser.fullNameEn = toNullableString(token.fullNameEn);
        sUser.branchId = toNullableString(token.branchId);
        sUser.primaryBranchId = toNullableString(token.primaryBranchId);
      }
      return session;
    },
  },
};

export default authOptions;
