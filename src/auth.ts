import NextAuth, { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

/**
 * دالة مساعدة للحصول على الجلسة الحالية من السيرفر (Server Components / API Routes / Server Actions)
 * توفر استدعاء await auth() بسلاسة وبشكل يتوافق تماماً مع Next.js 15 و NextAuth v4.
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
