import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { branches } from "@/db/schema";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await db.select().from(branches);
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/branches error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
