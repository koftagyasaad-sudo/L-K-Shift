import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      phone: string;
      fullNameAr: string;
      fullNameEn: string | null;
      systemRole: "SUPER_ADMIN" | "EMPLOYEE";
      primaryBranchId: number | null;
    };
  }

  interface User {
    phone: string;
    fullNameAr: string;
    fullNameEn: string | null;
    systemRole: "SUPER_ADMIN" | "EMPLOYEE";
    primaryBranchId: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    phone?: string;
    fullNameAr?: string;
    fullNameEn?: string | null;
    systemRole?: "SUPER_ADMIN" | "EMPLOYEE";
    primaryBranchId?: number | null;
  }
}
