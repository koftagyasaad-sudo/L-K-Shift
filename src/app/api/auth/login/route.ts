import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "استخدم تسجيل الدخول الرسمي للنظام." },
    { status: 410 }
  );
}