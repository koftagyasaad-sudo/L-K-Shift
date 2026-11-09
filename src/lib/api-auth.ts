import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { customRoles, users } from "@/db/schema";

export interface ApiPrincipal {
  id: number;
  systemRole: string;
  jobRole: string;
  primaryBranchId: number | null;
  branchScope: string;
  allowedBranchIds: number[];
  permissions: string[];
}

export type ApiAuthorization =
  | { principal: ApiPrincipal; response?: never }
  | { principal?: never; response: NextResponse };

export function hasApiPermission(principal: ApiPrincipal, permission: string): boolean {
  return principal.permissions.includes("*") || principal.permissions.includes(permission);
}

export function canAccessBranch(principal: ApiPrincipal, branchId: number | null): boolean {
  if (principal.systemRole === "SUPER_ADMIN" || principal.branchScope === "ALL") return true;
  if (branchId === null) return false;
  if (principal.branchScope === "CUSTOM") {
    return principal.allowedBranchIds.includes(branchId);
  }
  return principal.primaryBranchId === branchId;
}

function parsePermissions(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((permission): permission is string => typeof permission === "string");
  }

  if (typeof value === "string") {
    try {
      return parsePermissions(JSON.parse(value));
    } catch {
      return [];
    }
  }

  if (typeof value === "object" && value !== null) {
    return Object.entries(value)
      .filter(([, enabled]) => enabled === true)
      .map(([permission]) => permission);
  }

  return [];
}

function parseBranchIds(value: unknown): number[] {
  const parsed = typeof value === "string" ? (() => {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return [];
    }
  })() : value;

  if (!Array.isArray(parsed)) return [];
  return parsed
    .map(Number)
    .filter((branchId) => Number.isSafeInteger(branchId) && branchId > 0);
}

export async function authorizeApi(
  requiredPermissions?: string | string[]
): Promise<ApiAuthorization> {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as any;
  const sessionPhone = sessionUser?.phone ? String(sessionUser.phone).trim() : null;
  const rawId = sessionUser?.id ? Number(sessionUser.id) : null;
  const validId = rawId && Number.isSafeInteger(rawId) && rawId > 0 ? rawId : null;

  if (!session?.user || (!sessionPhone && !validId)) {
    return {
      response: NextResponse.json({ message: "غير مصرح" }, { status: 401 }),
    };
  }

  const lookupConditions = [];
  if (validId) lookupConditions.push(eq(users.id, validId));
  if (sessionPhone) lookupConditions.push(eq(users.phone, sessionPhone));

  const [user] = await db
    .select({
      id: users.id,
      systemRole: users.systemRole,
      jobRole: users.jobRole,
      primaryBranchId: users.primaryBranchId,
      isActive: users.isActive,
    })
    .from(users)
    .where(and(lookupConditions.length > 1 ? or(...lookupConditions) : lookupConditions[0], eq(users.isActive, true)))
    .limit(1);

  if (!user) {
    return {
      response: NextResponse.json({ message: "غير مصرح" }, { status: 401 }),
    };
  }

  let permissions: string[] = [];
  let branchScope = "OWN_BRANCH";
  let allowedBranchIds: number[] = [];
  if (user.systemRole === "SUPER_ADMIN") {
    permissions = ["*"];
    branchScope = "ALL";
  } else {
    const [role] = await db
      .select({
        permissions: customRoles.permissions,
        branchScope: customRoles.branchScope,
        allowedBranchIds: customRoles.allowedBranchIds,
      })
      .from(customRoles)
      .where(or(eq(customRoles.name, user.jobRole), eq(customRoles.nameAr, user.jobRole)))
      .limit(1);
    permissions = parsePermissions(role?.permissions).filter((permission) => permission !== "*");
    branchScope = role?.branchScope || "OWN_BRANCH";
    allowedBranchIds = parseBranchIds(role?.allowedBranchIds);
  }

  const required = requiredPermissions
    ? Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions]
    : [];

  if (
    required.length > 0 &&
    !permissions.includes("*") &&
    !required.some((permission) => permissions.includes(permission))
  ) {
    return {
      response: NextResponse.json({ message: "ممنوع" }, { status: 403 }),
    };
  }

  return {
    principal: {
      id: user.id,
      systemRole: user.systemRole,
      jobRole: user.jobRole,
      primaryBranchId: user.primaryBranchId,
      branchScope,
      allowedBranchIds,
      permissions,
    },
  };
}

export async function requireApiPrincipal(
  requiredPermissions?: string | string[]
): Promise<ApiPrincipal> {
  const authorization = await authorizeApi(requiredPermissions);
  if ("response" in authorization && authorization.response) {
    throw new Error(authorization.response.status === 401 ? "غير مصرح" : "ممنوع");
  }
  return authorization.principal;
}