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
      <section className="rounded-[32px] bg-[#121212] p-8 text-white shadow-2xl shadow-black/20">
        <h1 className="text-4xl font-black">{t("adminRoles.title")}</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-white/75">{t("adminRoles.subtitle")}</p>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <form
          action={createRoleAction}
          className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#171717]"
        >
          <input type="hidden" name="locale" value={locale} />
          <h2 className="text-2xl font-bold text-slate-950 dark:text-white">{t("adminRoles.createRole")}</h2>
          <div className="mt-6 grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("adminRoles.roleName")}</span>
              <input
                name="name"
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none dark:border-white/10 dark:bg-white/5"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("adminRoles.roleNameAr")}</span>
              <input
                name="nameAr"
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none dark:border-white/10 dark:bg-white/5"
              />
            </label>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{t("adminRoles.permissions")}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {permissionCatalog.map((group) => (
                <div key={group.category} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    {locale === "ar" ? group.categoryAr : group.category}
                  </p>
                  <div className="mt-4 space-y-3">
                    {group.items.map((item) => (
                      <label key={item.id} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
                        <input type="checkbox" name="permissions" value={item.id} className="mt-1" />
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
            className="mt-6 rounded-2xl bg-[#D8261C] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#D8261C]/30 transition hover:bg-[#bb2319]"
          >
            {t("adminRoles.create")}
          </button>
        </form>

        <div className="space-y-6">
          <form
            action={assignBranchScopeAction}
            className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#171717]"
          >
            <input type="hidden" name="locale" value={locale} />
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white">{t("adminRoles.assignScope")}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("adminRoles.adminUser")}</span>
                <select
                  name="userId"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none dark:border-white/10 dark:bg-white/5"
                >
                  {adminRows.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {locale === "ar" ? admin.fullNameAr : admin.fullNameEn ?? admin.fullNameAr}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("adminRoles.branch")}</span>
                <select
                  name="branchId"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none dark:border-white/10 dark:bg-white/5"
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
              className="mt-6 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
            >
              {t("adminRoles.assign")}
            </button>
          </form>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#171717]">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">{t("adminRoles.assignedScopes")}</h2>
            <div className="mt-5 space-y-4">
              {scopeSummary.map(({ admin, scopes }) => (
                <div key={admin.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    {locale === "ar" ? admin.fullNameAr : admin.fullNameEn ?? admin.fullNameAr}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {scopes.length === 0 ? (
                      <span className="text-sm text-slate-500 dark:text-slate-400">—</span>
                    ) : (
                      scopes.map((scope) => (
                        <span
                          key={`${scope.userId}-${scope.branchId}`}
                          className="rounded-full bg-[#D8261C]/10 px-3 py-1 text-xs font-semibold text-[#D8261C]"
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
