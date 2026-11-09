import { describe, expect, it } from "vitest";
import { canAccessBranch, hasApiPermission, type ApiPrincipal } from "./api-auth";

function principal(overrides: Partial<ApiPrincipal> = {}): ApiPrincipal {
  return {
    id: 8,
    systemRole: "EMPLOYEE",
    jobRole: "Employee",
    primaryBranchId: 3,
    branchScope: "OWN_BRANCH",
    allowedBranchIds: [],
    permissions: ["attendance.view"],
    ...overrides,
  };
}

describe("API permissions", () => {
  it("grants only explicitly assigned permissions to custom roles", () => {
    const user = principal();

    expect(hasApiPermission(user, "attendance.view")).toBe(true);
    expect(hasApiPermission(user, "payroll.view")).toBe(false);
  });

  it("supports wildcard permissions for principals that are explicitly granted them", () => {
    expect(hasApiPermission(principal({ permissions: ["*"] }), "roles.manage")).toBe(true);
  });
});

describe("branch scope", () => {
  it("limits the default scope to the assigned branch", () => {
    const user = principal();

    expect(canAccessBranch(user, 3)).toBe(true);
    expect(canAccessBranch(user, 4)).toBe(false);
    expect(canAccessBranch(user, null)).toBe(false);
  });

  it("limits custom scope to the listed branches", () => {
    const user = principal({
      branchScope: "CUSTOM",
      allowedBranchIds: [4, 6],
    });

    expect(canAccessBranch(user, 4)).toBe(true);
    expect(canAccessBranch(user, 3)).toBe(false);
  });

  it("allows all branches only for an all-branch scope or system super-admin", () => {
    expect(canAccessBranch(principal({ branchScope: "ALL" }), null)).toBe(true);
    expect(canAccessBranch(principal({ systemRole: "SUPER_ADMIN" }), null)).toBe(true);
  });
});
