import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { customRoles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const [role] = await db
      .select()
      .from(customRoles)
      .where(eq(customRoles.id, id))
      .limit(1);

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: role,
    });
  } catch (error: any) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { name, nameAr, nameEn, description, permissions } = body;

    const updatePayload: any = {
      updatedAt: new Date(),
    };

    if (nameAr !== undefined || name !== undefined) {
      updatePayload.nameAr = nameAr || name;
    }
    if (nameEn !== undefined || name !== undefined) {
      updatePayload.nameEn = nameEn || name;
    }
    if (description !== undefined) {
      updatePayload.description = description;
    }
    if (permissions !== undefined) {
      updatePayload.permissions = permissions;
    }

    const [updatedRole] = await db
      .update(customRoles)
      .set(updatePayload)
      .where(eq(customRoles.id, id))
      .returning();

    if (!updatedRole) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedRole,
    });
  } catch (error: any) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const [deletedRole] = await db
      .delete(customRoles)
      .where(eq(customRoles.id, id))
      .returning();

    if (!deletedRole) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedRole,
    });
  } catch (error: any) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
