import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.phone, credentials.phone))
          .limit(1);

        if (!user) return null;

        if (user.password !== credentials.password) return null;

        // مطابقة كائن المستخدم مع واجهة NextAuth المخصصة
        const userResult: any = {
          id: user.id,
          name: user.name,
          fullNameAr: user.name,
          fullNameEn: user.name,
          phone: user.phone,
          role: user.role,
          systemRole: user.role,
          branchId: user.branchId,
          primaryBranchId: user.branchId,
        };

        return userResult;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || (user as any).systemRole;
        token.systemRole = (user as any).systemRole || (user as any).role;
        token.branchId = (user as any).branchId || (user as any).primaryBranchId;
        token.primaryBranchId = (user as any).primaryBranchId || (user as any).branchId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).systemRole = token.systemRole as string;
        (session.user as any).branchId = token.branchId as string;
        (session.user as any).primaryBranchId = token.primaryBranchId as string;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "lk-shift-secret-key-production-2025",
};

export async function auth() {
  return await getServerSession(authOptions);
}
