import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { branches } from "@/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allBranches = await db.select().from(branches).orderBy(branches.id);
  return NextResponse.json(allBranches);
}
