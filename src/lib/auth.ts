import { NextAuthOptions, User, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { sql } from "drizzle-orm";
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
  passwordHash: string;
  isActive: boolean;
  systemRole: string | null;
  jobRole: string | null;
  primaryBranchId: string | null;
  fullNameAr: string | null;
  fullNameEn: string | null;
}

let usersSchemaHealed = false;
async function ensureUsersSchema() {
  if (usersSchemaHealed) return;
  const statements = [
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name_ar text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name_en text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS system_role text DEFAULT 'EMPLOYEE'`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS job_role text DEFAULT 'موظف'`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_branch_id text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_number text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_code text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_salary numeric DEFAULT 5000`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS working_hours_per_day integer DEFAULT 8`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS shift_name text DEFAULT 'الشيفت الصباحي'`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS shift_start_time text DEFAULT '10:00'`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS shift_end_time text DEFAULT '18:00'`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp text`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expires_at timestamptz`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at timestamptz`,
  ];
  for (const stmt of statements) {
    try { await db.execute(stmt); } catch {}
  }
  // Ensure primary admin account is active
  try {
    await db.execute(sql`
      UPDATE users
      SET is_active = true
      WHERE system_role::text = 'SUPER_ADMIN' OR job_role ILIKE '%مدير النظام%';
    `);
  } catch {}
  usersSchemaHealed = true;
}

async function loadAuthUser(id: string | null, phone: string | null): Promise<AuthDatabaseUser | null> {
  await ensureUsersSchema();
  const cleanId = id ? id.trim() : null;
  const cleanPhone = phone ? phone.trim() : null;
  const condition = cleanId
    ? sql`id::text = ${cleanId}`
    : cleanPhone
      ? sql`BTRIM(phone) = ${cleanPhone}`
      : null;
  if (!condition) return null;

  const rows = getSqlRows<AuthDatabaseUser>(await db.execute(sql`
    SELECT
      id::text AS id,
      BTRIM(phone) AS phone,
      COALESCE(password_hash, '') AS "passwordHash",
      COALESCE(is_active, true) AS "isActive",
      COALESCE(system_role::text, 'EMPLOYEE') AS "systemRole",
      COALESCE(BTRIM(job_role), 'موظف') AS "jobRole",
      primary_branch_id::text AS "primaryBranchId",
      COALESCE(full_name_ar, phone) AS "fullNameAr",
      full_name_en AS "fullNameEn"
    FROM users
    WHERE ${condition}
    LIMIT 1;
  `));
  return rows[0] ?? null;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "lk-shift-super-secret-jwt-key-prod-2026",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
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
            return null;
          }

          const phone = rawPhone.trim();
          const password = credentials.password;

          const currentUser = await loadAuthUser(null, phone);
          if (!currentUser) {
            console.warn("[AUTH] User not found for phone:", phone);
            return null;
          }

          if (currentUser.isActive === false) {
            console.warn("[AUTH] User account is inactive:", phone);
            return null;
          }

          if (!currentUser.passwordHash) {
            console.warn("[AUTH] Empty password hash for:", phone);
            return null;
          }

          const verification = await verifyPassword(password, currentUser.passwordHash);
          if (!verification.isValid) {
            console.warn("[AUTH] Invalid password for:", phone);
            return null;
          }

          if (verification.needsRehash) {
            try {
              const newHash = await hashPassword(password);
              await db.execute(sql`
                UPDATE users SET password_hash = ${newHash}, updated_at = NOW()
                WHERE id::text = ${currentUser.id};
              `);
            } catch {}
          }

          try {
            await db.execute(sql`UPDATE users SET last_login_at = NOW() WHERE id::text = ${currentUser.id};`);
          } catch {}

          const role = currentUser.jobRole || "EMPLOYEE";
          const systemRoleVal = (currentUser.systemRole || "EMPLOYEE") as SystemRoleType;
          const branchId = toNullableString(currentUser.primaryBranchId);
          const fullNameAr = toNullableString(currentUser.fullNameAr);
          const fullNameEn = toNullableString(currentUser.fullNameEn);
          const displayName = fullNameAr || fullNameEn || phone;

          return {
            id: currentUser.id,
            name: displayName,
            email: null,
            phone: currentUser.phone || phone,
            role,
            systemRole: systemRoleVal,
            fullNameAr,
            fullNameEn,
            branchId,
            primaryBranchId: branchId,
          };
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
        token.phone = u.phone;
        token.role = u.role || "EMPLOYEE";
        token.systemRole = (u.systemRole || "EMPLOYEE") as SystemRoleType;
        token.fullNameAr = u.fullNameAr ?? null;
        token.fullNameEn = u.fullNameEn ?? null;
        token.branchId = u.branchId ?? null;
        token.primaryBranchId = u.primaryBranchId ?? null;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        const sUser = session.user as AppUser;
        sUser.id = token.id ? String(token.id) : "";
        sUser.phone = token.phone ? String(token.phone) : "";
        sUser.role = token.role ? String(token.role) : "EMPLOYEE";
        sUser.systemRole = (token.systemRole || "EMPLOYEE") as SystemRoleType;
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
