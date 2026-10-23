// src/auth.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

// Next.js 15 App Router: route.ts expects named GET/POST exports
export const handlers = {
  GET: handler,
  POST: handler,
};

export { handler as GET, handler as POST };
export { authOptions };

export default handler;
