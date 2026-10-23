import NextAuth from "next-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export const handlers = {
  GET: handler,
  POST: handler,
};

export async function auth() {
  return await getServerSession(authOptions);
}

export { authOptions };
export default auth;
