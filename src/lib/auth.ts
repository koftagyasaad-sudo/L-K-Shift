import { NextAuthOptions, User, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { getSqlRows } from "@/lib/db";
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

interface AuthDatabaseUser extends Record<string, unknown> {
  id: string;
  phone: string;
  systemRole: string | null;
  jobRole: string | null;
  primaryBranchId: string | null;
  branchId: string | null;
  fullNameAr: string | null;
  fullNameEn: string | null;
}

async function loadAuthUser(id: string | null, phone: string | null): Promise<AuthDatabaseUser | null> {
  const condition = id
    ? sql`id::text = ${id}`
    : phone
      ? sql`phone = ${phone}`
      : null;
  if (!condition) return null;

  const rows = getSqlRows<AuthDatabaseUser>(await db.execute(sql`
    SELECT
      id::text AS id,
      phone,
      system_role::text AS "systemRole",
      job_role AS "jobRole",
      primary_branch_id::text AS "primaryBranchId",
      branch_id::text AS "branchId",
      full_name_ar AS "fullNameAr",
      full_name_en AS "fullNameEn"
    FROM users
    WHERE ${condition}
    LIMIT 1;
  `));
  return rows[0] ?? null;
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

          const currentUser = await loadAuthUser(String(user.id), phone);
          if (!currentUser) return null;

          const role = currentUser.jobRole || "EMPLOYEE";
          const systemRoleVal = (currentUser.systemRole || "EMPLOYEE") as SystemRoleType;
          const branchId = toNullableString(currentUser.primaryBranchId ?? currentUser.branchId);
          const fullNameAr = toNullableString(currentUser.fullNameAr);
          const fullNameEn = toNullableString(currentUser.fullNameEn);
          const displayName = fullNameAr || fullNameEn || phone;

          const result: AppUser = {
            id: currentUser.id,
            name: displayName,
            email: null,
            phone: currentUser.phone || phone,
            role,
            systemRole: systemRoleVal,
            fullNameAr,
            fullNameEn,
            branchId,
            primaryBranchId: toNullableString(currentUser.primaryBranchId),
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
      const id = user?.id ? String(user.id) : token.id ? String(token.id) : null;
      const phone = user?.phone ? String(user.phone).trim() : token.phone ? String(token.phone).trim() : null;
      const currentUser = await loadAuthUser(id, phone);

      token.id = currentUser?.id ?? id ?? undefined;
      token.phone = currentUser?.phone ?? null;
      token.role = currentUser?.jobRole || "EMPLOYEE";
      token.systemRole = (currentUser?.systemRole || "EMPLOYEE") as SystemRoleType;
      token.fullNameAr = currentUser?.fullNameAr ?? null;
      token.fullNameEn = currentUser?.fullNameEn ?? null;
      token.branchId = toNullableString(currentUser?.primaryBranchId ?? currentUser?.branchId);
      token.primaryBranchId = toNullableString(currentUser?.primaryBranchId);
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        const sUser = session.user as AppUser;
        const currentUser = await loadAuthUser(
          token.id ? String(token.id) : null,
          token.phone ? String(token.phone).trim() : null
        );
        sUser.id = currentUser?.id ?? (token.id ? String(token.id) : "");
        sUser.phone = currentUser?.phone ?? "";
        sUser.role = currentUser?.jobRole || "EMPLOYEE";
        sUser.systemRole = (currentUser?.systemRole || "EMPLOYEE") as SystemRoleType;
        sUser.fullNameAr = toNullableString(currentUser?.fullNameAr);
        sUser.fullNameEn = toNullableString(currentUser?.fullNameEn);
        sUser.branchId = toNullableString(currentUser?.primaryBranchId ?? currentUser?.branchId);
        sUser.primaryBranchId = toNullableString(currentUser?.primaryBranchId);
      }
      return session;
    },
  },
};

export default authOptions;
