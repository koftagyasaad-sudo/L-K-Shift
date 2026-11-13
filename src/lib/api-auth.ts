import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getSqlRows } from "@/lib/db";
import { getResilientSessionUser } from "@/lib/resilient-session";

export interface ApiPrincipal {
  id: string;
  systemRole: string;
  jobRole: string;
  primaryBranchId: string | null;
  branchScope: string;
  allowedBranchIds: string[];
  permissions: string[];
}

export type ApiAuthorization =
  | { principal: ApiPrincipal; response?: never }
  | { principal?: never; response: NextResponse };

export function hasApiPermission(principal: ApiPrincipal, permission: string): boolean {
  return principal.permissions.includes("*") || principal.permissions.includes(permission);
}

export function canAccessBranch(principal: ApiPrincipal, branchId: string | null): boolean {
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
    try { return parsePermissions(JSON.parse(value)); } catch { return []; }
  }
  if (typeof value === "object" && value !== null) {
    return Object.entries(value)
      .filter(([, enabled]) => enabled === true)
      .map(([permission]) => permission);
  }
  return [];
}

function parseBranchIds(value: unknown): string[] {
  const parsed = typeof value === "string" ? (() => {
    try { return JSON.parse(value) as unknown; } catch { return []; }
  })() : value;
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((branchId): branchId is string | number => typeof branchId === "string" || typeof branchId === "number")
    .map(String)
    .filter((branchId) => branchId.length > 0);
}

export async function authorizeApi(
  requiredPermissions?: string | string[]
): Promise<ApiAuthorization> {
  const sessionUser = await getResilientSessionUser();
  const sessionPhone = sessionUser?.phone ? String(sessionUser.phone).trim() : null;
  const validId = typeof sessionUser?.id === "string" && sessionUser.id.trim()
    ? sessionUser.id.trim()
    : null;

  if (!sessionUser || (!sessionPhone && !validId)) {
    return {
      response: NextResponse.json({ message: "غير مصرح" }, { status: 401 }),
    };
  }

  const condition = validId
    ? sql`id::text = ${validId}`
    : sql`BTRIM(phone) = ${sessionPhone}`;

  const rows = getSqlRows<{
    id: string;
    systemRole: string;
    jobRole: string;
    primaryBranchId: string | null;
    isActive: boolean;
  }>(
    await db.execute(sql`
      SELECT
        id::text AS id,
        COALESCE(system_role::text, 'EMPLOYEE') AS "systemRole",
        COALESCE(BTRIM(job_role), 'موظف') AS "jobRole",
        primary_branch_id::text AS "primaryBranchId",
        COALESCE(is_active, true) AS "isActive"
      FROM users
      WHERE ${condition}
      LIMIT 1;
    `)
  );

  const user = rows[0];
  if (!user || user.isActive !== true || String(user.jobRole || "").includes("قيد المراجعة")) {
    return {
      response: NextResponse.json({ message: "غير مصرح" }, { status: 401 }),
    };
  }

  const isSuperAdmin =
    user.jobRole === "مدير النظام" ||
    user.systemRole === "SUPER_ADMIN";

  let permissions: string[] = [];
  let branchScope = "OWN_BRANCH";
  let allowedBranchIds: string[] = [];

  if (isSuperAdmin) {
    permissions = ["*"];
    branchScope = "ALL";
  } else {
    try {
      const roleRows = getSqlRows<{
        permissions: unknown;
        branchScope: string | null;
        allowedBranchIds: unknown;
      }>(
        await db.execute(sql`
          SELECT
            permissions,
            branch_scope AS "branchScope",
            allowed_branch_ids AS "allowedBranchIds"
          FROM custom_roles
          WHERE BTRIM(name) = ${user.jobRole} OR BTRIM(name_ar) = ${user.jobRole}
          LIMIT 1;
        `)
      );
      const role = roleRows[0];
      permissions = parsePermissions(role?.permissions).filter((p) => p !== "*");
      branchScope = role?.branchScope || "OWN_BRANCH";
      allowedBranchIds = parseBranchIds(role?.allowedBranchIds);
    } catch {}
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
      systemRole: isSuperAdmin ? "SUPER_ADMIN" : user.systemRole,
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
