import type { ApiPrincipal } from "@/lib/api-auth";

export interface GovernanceFlags {
  isSystemAdmin: boolean;
  isOwner: boolean;
  isHr: boolean;
  isFinanceManager: boolean;
  isOperationsManager: boolean;
  isBranchOrDirectManager: boolean;
}

export function getGovernanceFlags(principal: ApiPrincipal): GovernanceFlags {
  const roleText = String(principal.jobRole || "").trim();
  const isSystemAdmin =
    principal.systemRole === "SUPER_ADMIN" ||
    /مدير النظام|مسؤول النظام|system\s*admin/i.test(roleText);
  const isOwner = /اونر|أونر|المالك|مالك|owner/i.test(roleText);
  const isHr = /\bhr\b|موارد بشرية|الموارد البشرية|شئون العاملين|شؤون العاملين/i.test(roleText);
  const isFinanceManager = /مدير مالي|المدير المالي|مالية|finance|financial/i.test(roleText);
  const isOperationsManager = /مدير تشغيل|مدير التشغيل|التشغيل|operations/i.test(roleText);
  const isBranchOrDirectManager =
    isSystemAdmin ||
    isOwner ||
    isHr ||
    isOperationsManager ||
    principal.systemRole !== "EMPLOYEE" ||
    /مدير|مشرف|supervisor|manager/i.test(roleText);

  return {
    isSystemAdmin,
    isOwner,
    isHr,
    isFinanceManager,
    isOperationsManager,
    isBranchOrDirectManager,
  };
}

export function canViewRequestByType(
  principal: ApiPrincipal,
  requestType: string,
  opts: { isOwn: boolean; isSubmittedByMe: boolean; isBranchMatch: boolean }
): boolean {
  if (opts.isOwn || opts.isSubmittedByMe) return true;
  const g = getGovernanceFlags(principal);
  const type = String(requestType || "LEAVE").toUpperCase();

  // 1. الشكاوى: HR + مدير النظام + الأونر فقط
  if (type === "COMPLAINT") {
    return g.isHr || g.isSystemAdmin || g.isOwner;
  }

  // 2. الجزاءات والخصومات وطلبات العمالة: HR + مدير النظام + الأونر
  if (type === "PENALTY" || type === "STAFF_REQUEST") {
    return g.isHr || g.isSystemAdmin || g.isOwner;
  }

  // 3. السلف: مدير الفرع + مدير التشغيل + المدير المالي + HR + مسؤول النظام + الأونر
  if (type === "ADVANCE") {
    return (
      g.isSystemAdmin ||
      g.isOwner ||
      g.isHr ||
      g.isFinanceManager ||
      g.isOperationsManager ||
      (g.isBranchOrDirectManager && opts.isBranchMatch)
    );
  }

  // 4. الإجازات والأذون: المدير المباشر/الفرع + مدير التشغيل + HR + مدير النظام (+ الأونر)
  return (
    g.isSystemAdmin ||
    g.isOwner ||
    g.isHr ||
    g.isOperationsManager ||
    (g.isBranchOrDirectManager && opts.isBranchMatch)
  );
}

export function canApproveRequestByType(
  principal: ApiPrincipal,
  requestType: string,
  isBranchMatch: boolean
): boolean {
  const g = getGovernanceFlags(principal);
  const type = String(requestType || "LEAVE").toUpperCase();

  if (type === "COMPLAINT" || type === "PENALTY" || type === "STAFF_REQUEST") {
    return g.isHr || g.isSystemAdmin || g.isOwner;
  }

  if (type === "ADVANCE") {
    return (
      g.isSystemAdmin ||
      g.isOwner ||
      g.isHr ||
      g.isFinanceManager ||
      g.isOperationsManager ||
      (g.isBranchOrDirectManager && isBranchMatch)
    );
  }

  return (
    g.isSystemAdmin ||
    g.isOwner ||
    g.isHr ||
    g.isOperationsManager ||
    (g.isBranchOrDirectManager && isBranchMatch)
  );
}
