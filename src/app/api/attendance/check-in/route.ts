import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { attendanceLogs, branches, users } from "@/db/schema";
import { eq } from "drizzle-orm";

function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // meters
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) *
      Math.cos(lat2 * rad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id as string;
    const { latitude, longitude, photoUrl, notes } = await req.json();

    if (!latitude || !longitude || !photoUrl) {
      return NextResponse.json(
        { success: false, error: "Latitude, longitude, and selfie photo are required" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.branchId) {
      return NextResponse.json(
        { success: false, error: "Employee has no assigned branch" },
        { status: 400 }
      );
    }

    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, user.branchId))
      .limit(1);

    if (!branch) {
      return NextResponse.json(
        { success: false, error: "Branch not found" },
        { status: 404 }
      );
    }

    const distance = calculateHaversineDistance(
      Number(latitude),
      Number(longitude),
      Number(branch.latitude),
      Number(branch.longitude)
    );

    const allowedRadius = (branch as any).geofenceRadius || (branch as any).radiusMeters || 100;
    if (distance > allowedRadius) {
      return NextResponse.json(
        {
          success: false,
          error: `You are outside the branch area (${Math.round(distance)}m away, max allowed ${allowedRadius}m)`,
        },
        { status: 400 }
      );
    }

    const logPayload: any = {
      id: crypto.randomUUID(),
      userId,
      branchId: branch.id,
      type: "CHECK_IN",
      timestamp: new Date(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      distanceMeters: Math.round(distance),
      photoUrl,
      status: "PRESENT",
      notes: notes || null,
    };

    const [log] = await db
      .insert(attendanceLogs)
      .values(logPayload)
      .returning();

    return NextResponse.json({ success: true, data: log });
  } catch (error: any) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
