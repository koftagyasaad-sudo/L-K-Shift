import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

export type SystemRoleType = "SUPER_ADMIN" | "EMPLOYEE" | "ADMIN" | "MANAGER" | string;

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    phone?: string | null;
    role?: string | null;
    systemRole?: SystemRoleType | null;
    fullNameAr?: string | null;
    fullNameEn?: string | null;
    branchId?: string | null;
    primaryBranchId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      phone?: string | null;
      role?: string | null;
      systemRole?: SystemRoleType | null;
      fullNameAr?: string | null;
      fullNameEn?: string | null;
      branchId?: string | null;
      primaryBranchId?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    phone?: string | null;
    role?: string | null;
    systemRole?: SystemRoleType | null;
    fullNameAr?: string | null;
    fullNameEn?: string | null;
    branchId?: string | null;
    primaryBranchId?: string | null;
  }
}
