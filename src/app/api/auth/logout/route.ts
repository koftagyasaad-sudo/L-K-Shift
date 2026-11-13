import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function POST() {
  const res = NextResponse.json({ success: true });
  for (const name of [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.csrf-token",
    "__Host-next-auth.csrf-token",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
    "auth_session",
  ]) {
    res.cookies.set(name, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }
  return res;
}
