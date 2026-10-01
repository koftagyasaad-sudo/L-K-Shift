import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureDemoLoginUser, ensureSeedData } from "@/db/seed";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        await ensureSeedData();
        await ensureDemoLoginUser();

        const phone = String(credentials?.phone ?? "").trim();
        const password = String(credentials?.password ?? "");

        if (!phone || !password) {
          return null;
        }

        const record = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
        const user = record[0];

        if (!user || !user.isActive) {
          return null;
        }

        const isValid = await compare(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

        return {
          id: String(user.id),
          name: user.fullNameEn ?? user.fullNameAr,
          phone: user.phone,
          fullNameAr: user.fullNameAr,
          fullNameEn: user.fullNameEn,
          systemRole: user.systemRole,
          primaryBranchId: user.primaryBranchId,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id;
        token.phone = (user as { phone?: string }).phone;
        token.fullNameAr = (user as { fullNameAr?: string }).fullNameAr;
        token.fullNameEn = (user as { fullNameEn?: string | null }).fullNameEn ?? null;
        token.systemRole = (user as { systemRole?: "SUPER_ADMIN" | "EMPLOYEE" }).systemRole;
        token.primaryBranchId = (user as { primaryBranchId?: number | null }).primaryBranchId ?? null;
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.phone = typeof token.phone === "string" ? token.phone : "";
        session.user.fullNameAr = typeof token.fullNameAr === "string" ? token.fullNameAr : session.user.name ?? "";
        session.user.fullNameEn = typeof token.fullNameEn === "string" ? token.fullNameEn : null;
        session.user.systemRole = token.systemRole === "SUPER_ADMIN" ? "SUPER_ADMIN" : "EMPLOYEE";
        session.user.primaryBranchId = typeof token.primaryBranchId === "number" ? token.primaryBranchId : null;
      }

      return session;
    },
  },
});
