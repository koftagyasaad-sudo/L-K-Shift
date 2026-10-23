import NextAuth, { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

/**
 * دالة مساعدة للحصول على الجلسة الحالية من السيرفر
 */
export async function auth() {
  return await getServerSession(authOptions);
}

export const handlers = {
  GET: handler,
  POST: handler,
};

export { handler as GET, handler as POST };
export { authOptions };

export default handler;
