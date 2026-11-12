import { NextAuthOptions, User, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import type { SystemRoleType } from "@/types/next-auth";

export type AppUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone: string;
  role: string;
  systemRole: SystemRoleType;
  fullNameAr?: string | null;
  fullNameEn?: string | null;
  branchId?: string | null;
  primaryBranchId?: string | null;
};

function toNullableString(val: unknown): string | null {
  if (val === undefined || val === null || val === "") return null;
  return String(val);
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "lk-shift-super-secret-jwt-key-prod-2026",
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
        username: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<AppUser | null> {
        try {
          const rawPhone = credentials?.phone || credentials?.username;
          if (!rawPhone || !credentials?.password) {
            console.warn("[AUTH] Missing credentials payload");
            return null;
          }

          const phone = rawPhone.trim();
          const password = credentials.password;

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

          const isActive = user.isActive;
          if (!isActive) {
            console.warn(`[AUTH] User account is inactive: ${phone}`);
            return null;
          }

          const passwordHash = user.passwordHash;
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

          const role = user.jobRole || "SUPER_ADMIN";
          const systemRoleVal = user.systemRole || "SUPER_ADMIN";
          const branchId = toNullableString(user.primaryBranchId);
          const fullNameAr = toNullableString(user.fullNameAr);
          const fullNameEn = toNullableString(user.fullNameEn);
          const displayName = fullNameAr || fullNameEn || phone;

          const result: AppUser = {
            id: String(user.id),
            name: displayName,
            email: null,
            phone: user.phone || phone,
            role,
            systemRole: systemRoleVal,
            fullNameAr,
            fullNameEn,
            branchId,
            primaryBranchId: branchId,
          };

          return result;
        } catch (error) {
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
        token.systemRole = u.systemRole ?? u.role ?? "SUPER_ADMIN";
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
        sUser.systemRole = token.systemRole || "SUPER_ADMIN";
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
