import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

/**
 * نموذج المستخدم الموسع للنظام.
 * التسجيل يعتمد على رقم الهاتف فقط كاسم مستخدم (Phone is login ID).
 */
export type AppUser = User & {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  systemRole?: any;
  fullNameAr?: string | null;
  fullNameEn?: string | null;
  branchId?: string | null;
  primaryBranchId?: string | null;
};

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
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
        if (!credentials?.phone || !credentials?.password) {
          return null;
        }

        const phone = String(credentials.phone).trim();
        const password = String(credentials.password);

        const found = await db
          .select()
          .from(users)
          .where(eq(users.phone, phone))
          .limit(1);

        const user = found[0];
        if (!user) {
          return null;
        }

        const isActive =
          (user as any).isActive !== false && (user as any).active !== false;
        if (!isActive) {
          return null;
        }

        const passwordHash =
          (user as any).passwordHash ||
          (user as any).password ||
          (user as any).hashedPassword;

        if (!passwordHash || typeof passwordHash !== "string") {
          return null;
        }

        const valid = await bcrypt.compare(password, passwordHash);
        if (!valid) {
          return null;
        }

        const role = toNullableString((user as any).role) || "employee";
        const systemRoleVal = (user as any).systemRole || (user as any).role || "EMPLOYEE";

        const branchId = toNullableString(
          (user as any).branchId ?? (user as any).primaryBranchId
        );
        const primaryBranchId = toNullableString(
          (user as any).primaryBranchId ?? (user as any).branchId
        );

        const fullNameAr = toNullableString((user as any).fullNameAr);
        const fullNameEn = toNullableString((user as any).fullNameEn);
        const displayName =
          fullNameEn ||
          fullNameAr ||
          toNullableString((user as any).name) ||
          phone;

        const result: AppUser = {
          id: String(user.id),
          name: displayName,
          email: toNullableString((user as any).email),
          phone: toNullableString((user as any).phone) || phone,
          role,
          systemRole: systemRoleVal as any,
          fullNameAr,
          fullNameEn,
          branchId,
          primaryBranchId,
        };

        return result;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User | AppUser }) {
      if (user) {
        const u = user as AppUser;
        token.id = String(u.id);
        token.phone = u.phone ?? null;
        token.role = u.role ?? null;
        token.systemRole = (u.systemRole ?? u.role ?? "EMPLOYEE") as any;
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
        sUser.id = toNullableString(token.id) || sUser.id || "";
        sUser.phone = toNullableString(token.phone);
        sUser.role = toNullableString(token.role);
        sUser.systemRole = (toNullableString(token.systemRole) || toNullableString(token.role) || "EMPLOYEE") as any;
        sUser.fullNameAr = toNullableString(token.fullNameAr);
        sUser.fullNameEn = toNullableString(token.fullNameEn);
        sUser.branchId = toNullableString(token.branchId);
        sUser.primaryBranchId = toNullableString(
          token.primaryBranchId ?? token.branchId
        );
        sUser.name =
          sUser.name ||
          sUser.fullNameEn ||
          sUser.fullNameAr ||
          sUser.phone ||
          null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;
