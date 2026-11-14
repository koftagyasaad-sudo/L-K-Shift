import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { authorizeApi } from "@/lib/api-auth";
import AdminRoutePermissionGuard from "@/components/AdminRoutePermissionGuard";

export const dynamic = "force-dynamic";

interface AdminLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale === "en" ? "en" : "ar";

  const auth = await authorizeApi();
  if (!("principal" in auth) || !auth.principal) {
    redirect(`/${locale}/login`);
  }

  const principal = auth.principal;
  const isSuperAdmin =
    principal.systemRole === "SUPER_ADMIN" ||
    principal.jobRole === "مدير النظام" ||
    principal.permissions.includes("*");

  // Regular employees with zero admin permissions are immediately redirected to /attendance
  if (!isSuperAdmin && principal.permissions.length === 0) {
    redirect(`/${locale}/attendance`);
  }

  return (
    <AdminRoutePermissionGuard
      serverPermissions={principal.permissions}
      isSuperAdmin={isSuperAdmin}
    >
      {children}
    </AdminRoutePermissionGuard>
  );
}
