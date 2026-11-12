import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { authorizeApi, hasApiPermission } from "@/lib/api-auth";

function requiredPermissions(pathname: string): string[] {
  const path = pathname.replace(/^\/(?:ar|en)(?=\/|$)/, "") || "/";
  if (path === "/admin" || path.startsWith("/admin/dashboard")) return ["dashboard.view"];
  if (path.startsWith("/admin/attendance-review")) {
    return ["attendance.view", "attendance.review", "attendance.export"];
  }
  if (path.startsWith("/admin/branches")) return ["branches.view", "branches.manage"];
  if (path.startsWith("/admin/employees")) return ["employees.view", "employees.manage"];
  if (path.startsWith("/admin/leave-requests")) return ["leaves.view", "leaves.approve"];
  if (path.startsWith("/admin/recruitment")) return ["recruitment.view", "recruitment.manage"];
  if (path.startsWith("/admin/roles")) return ["roles.view", "roles.manage"];
  return [];
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pathname = (await headers()).get("x-lk-pathname") || "";
  const permissions = requiredPermissions(pathname);
  if (permissions.length === 0) notFound();

  const authorization = await authorizeApi();
  if ("response" in authorization) {
    if (authorization.response?.status === 401) redirect(`/${locale}/login`);
    notFound();
  }
  if (authorization.principal.systemRole === "EMPLOYEE") redirect(`/${locale}/attendance`);
  if (
    !hasApiPermission(authorization.principal, "*")
    && !permissions.some((permission) => hasApiPermission(authorization.principal, permission))
  ) {
    notFound();
  }

  return children;
}
