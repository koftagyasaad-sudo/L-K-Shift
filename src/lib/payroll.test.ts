import { describe, expect, it } from "vitest";
import { calculatePayroll } from "./payroll";

const employee = {
  id: "user-8",
  name: "Test Employee",
  role: "Employee",
  branchName: "Main branch",
  workingHoursPerDay: 8,
  basicSalary: 26_000,
};

describe("calculatePayroll", () => {
  it("pays the full monthly base salary for 26 complete working days", () => {
    const logs = Array.from({ length: 26 }, (_, index) => ({
      workDate: `2026-11-${String(index + 1).padStart(2, "0")}`,
      checkInTime: new Date(`2026-11-${String(index + 1).padStart(2, "0")}T08:00:00.000Z`),
      actualWorkedMinutes: 480,
      lateMinutes: 0,
      overtimeMinutes: 0,
    }));

    expect(calculatePayroll(employee, logs, [])).toMatchObject({
      basicSalary: 26_000,
      workedHours: 208,
      workedDays: 26,
      hourlyRate: "125.00",
      netSalary: 26_000,
    });
  });

  it("includes approved leave and advances, and applies overtime and lateness", () => {
    const result = calculatePayroll(employee, [{
      workDate: "2026-11-01",
      checkInTime: new Date("2026-11-01T08:00:00.000Z"),
      actualWorkedMinutes: 600,
      lateMinutes: 30,
      overtimeMinutes: 120,
    }], [
      {
        requestType: "LEAVE",
        status: "PENDING",
        finalStatus: "APPROVED",
        durationDays: 1,
        totalDays: null,
        advanceAmount: null,
      },
      {
        requestType: "ADVANCE",
        status: "APPROVED",
        finalStatus: null,
        durationDays: null,
        totalDays: null,
        advanceAmount: "500",
      },
      {
        requestType: "LEAVE",
        status: "REJECTED",
        finalStatus: null,
        durationDays: 5,
        totalDays: null,
        advanceAmount: null,
      },
    ]);

    expect(result).toMatchObject({
      workedHours: 10,
      workedDays: 1,
      overtimeHours: 2,
      approvedLeaveDays: 1,
      advanceDeductions: 500,
      netSalary: 2_063,
    });
  });

  it("never returns a negative net salary", () => {
    const result = calculatePayroll(employee, [], [{
      requestType: "ADVANCE",
      status: "APPROVED",
      finalStatus: null,
      durationDays: null,
      totalDays: null,
      advanceAmount: "50000",
    }]);

    expect(result.netSalary).toBe(0);
  });
});
