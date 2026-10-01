import { db } from "@/db";
import { ensureSeedData } from "@/db/seed";
import { adminBranchScopes, branches, customRoles, users } from "@/db/schema";
import { permissionCatalog } from "@/lib/permissions";
import { requireSuperAdmin } from "@/lib/auth-guards";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { assignBranchScopeAction, createRoleAction } from "./actions";
import { RolesTable } from "./roles-table";

export default async function AdminRolesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await ensureSeedData();
  await requireSuperAdmin(locale);
  const t = await getTranslations();

  const [roleRows, branchRows, adminRows, scopeRows] = await Promise.all([
    db.select().from(customRoles),
    db.select().from(branches),
    db.select().from(users).where(eq(users.systemRole, "SUPER_ADMIN")),
    db
      .select({
        id: adminBranchScopes.id,
        userId: adminBranchScopes.userId,
        branchId: adminBranchScopes.branchId,
        adminNameAr: users.fullNameAr,
        adminNameEn: users.fullNameEn,
        branchNameAr: branches.nameAr,
        branchNameEn: branches.nameEn,
      })
      .from(adminBranchScopes)
      .innerJoin(users, eq(users.id, adminBranchScopes.userId))
      .innerJoin(branches, eq(branches.id, adminBranchScopes.branchId)),
  ]);

  const roleTableData = roleRows.map((role) => ({
    id: role.id,
    name: role.name,
    nameAr: role.nameAr,
    permissionCount: role.permissions.length,
    isSystem: role.isSystem ? "yes" : "no",
    createdAt: role.createdAt,
  }));

  const scopeSummary = adminRows.map((admin) => ({
    admin,
    scopes: scopeRows.filter((scope) => scope.userId === admin.id),
  }));

  return (
    <div className="space-y-8">
      <section className="gradient-hero relative overflow-hidden rounded-[32px] p-8 text-white shadow-2xl shadow-primary/20">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <h1 className="text-4xl font-black">{t("adminRoles.title")}</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/85">{t("adminRoles.subtitle")}</p>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <form
          action={createRoleAction}
          className="rounded-[28px] border border-border bg-surface p-6 shadow-sm"
        >
          <input type="hidden" name="locale" value={locale} />
          <h2 className="text-2xl font-bold text-foreground">{t("adminRoles.createRole")}</h2>
          <div className="mt-6 grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">{t("adminRoles.roleName")}</span>
              <input
                name="name"
                required
                className="w-full rounded-2xl border border-border bg-background-secondary px-4 py-3 text-foreground outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">{t("adminRoles.roleNameAr")}</span>
              <input
                name="nameAr"
                required
                className="w-full rounded-2xl border border-border bg-background-secondary px-4 py-3 text-foreground outline-none focus:border-primary"
              />
            </label>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-foreground">{t("adminRoles.permissions")}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {permissionCatalog.map((group) => (
                <div key={group.category} className="rounded-3xl border border-border bg-background-secondary p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {locale === "ar" ? group.categoryAr : group.category}
                  </p>
                  <div className="mt-4 space-y-3">
                    {group.items.map((item) => (
                      <label key={item.id} className="flex items-start gap-3 text-sm text-foreground-muted">
                        <input type="checkbox" name="permissions" value={item.id} className="mt-1 accent-primary" />
                        <span>{locale === "ar" ? item.labelAr : item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary-hover"
          >
            {t("adminRoles.create")}
          </button>
        </form>

        <div className="space-y-6">
          <form
            action={assignBranchScopeAction}
            className="rounded-[28px] border border-border bg-surface p-6 shadow-sm"
          >
            <input type="hidden" name="locale" value={locale} />
            <h2 className="text-2xl font-bold text-foreground">{t("adminRoles.assignScope")}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">{t("adminRoles.adminUser")}</span>
                <select
                  name="userId"
                  className="w-full rounded-2xl border border-border bg-background-secondary px-4 py-3 text-foreground outline-none focus:border-primary"
                >
                  {adminRows.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {locale === "ar" ? admin.fullNameAr : admin.fullNameEn ?? admin.fullNameAr}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">{t("adminRoles.branch")}</span>
                <select
                  name="branchId"
                  className="w-full rounded-2xl border border-border bg-background-secondary px-4 py-3 text-foreground outline-none focus:border-primary"
                >
                  {branchRows.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {locale === "ar" ? branch.nameAr : branch.nameEn}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="submit"
              className="mt-6 rounded-2xl border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-background-secondary"
            >
              {t("adminRoles.assign")}
            </button>
          </form>

          <section className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-xl font-bold text-foreground">{t("adminRoles.assignedScopes")}</h2>
            <div className="mt-5 space-y-4">
              {scopeSummary.map(({ admin, scopes }) => (
                <div key={admin.id} className="rounded-3xl border border-border bg-background-secondary p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {locale === "ar" ? admin.fullNameAr : admin.fullNameEn ?? admin.fullNameAr}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {scopes.length === 0 ? (
                      <span className="text-sm text-foreground-muted">—</span>
                    ) : (
                      scopes.map((scope) => (
                        <span
                          key={`${scope.userId}-${scope.branchId}`}
                          className="bg-accent/10 text-accent rounded-full px-3 py-1 text-xs font-semibold"
                        >
                          {locale === "ar" ? scope.branchNameAr : scope.branchNameEn}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <RolesTable data={roleTableData} locale={locale} />
    </div>
  );
}
