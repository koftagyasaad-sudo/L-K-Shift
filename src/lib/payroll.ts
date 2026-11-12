export interface PayrollEmployee {
  id: string;
  name: string;
  role: string;
  branchName: string | null;
  workingHoursPerDay: number;
  basicSalary: number;
}

export interface PayrollAttendanceLog {
  workDate: string | Date;
  checkInTime: Date | null;
  actualWorkedMinutes: number;
  lateMinutes: number;
  overtimeMinutes: number;
}

export interface PayrollRequest {
  requestType: string | null;
  status: string;
  finalStatus: string | null;
  durationDays: number | null;
  totalDays: number | null;
  advanceAmount: number | string | null;
}

export function calculatePayroll(
  employee: PayrollEmployee,
  logs: PayrollAttendanceLog[],
  requests: PayrollRequest[]
) {
  const hoursPerDay = employee.workingHoursPerDay || 8;
  const basicSalary = employee.basicSalary;
  const hourlyRate = basicSalary / (hoursPerDay * 26);
  const workedMinutes = logs.reduce((total, log) => total + log.actualWorkedMinutes, 0);
  const workedDays = new Set(
    logs
      .filter((log) => log.checkInTime)
      .map((log) => String(log.workDate).slice(0, 10))
  ).size;
  const lateMinutes = logs.reduce((total, log) => total + log.lateMinutes, 0);
  const overtimeMinutes = logs.reduce((total, log) => total + log.overtimeMinutes, 0);
  const approvedRequests = requests.filter(
    (request) => request.finalStatus === "APPROVED" || request.status === "APPROVED"
  );
  const approvedLeaveDays = approvedRequests
    .filter((request) => request.requestType !== "ADVANCE")
    .reduce((total, request) => total + (request.durationDays ?? request.totalDays ?? 0), 0);
  const advanceDeductions = approvedRequests
    .filter((request) => request.requestType === "ADVANCE")
    .reduce((total, request) => total + Number(request.advanceAmount || 0), 0);
  const workedHours = workedMinutes / 60;
  const overtimeHours = overtimeMinutes / 60;
  const earnedBase = (workedHours + approvedLeaveDays * hoursPerDay) * hourlyRate;
  const overtimePay = overtimeHours * hourlyRate * 1.5;
  const lateDeduction = lateMinutes * hourlyRate / 60;
  const netSalary = Math.max(0, earnedBase + overtimePay - lateDeduction - advanceDeductions);

  return {
    userId: employee.id,
    name: employee.name,
    role: employee.role,
    branchName: employee.branchName || "الإدارة",
    workingHoursPerDay: hoursPerDay,
    basicSalary,
    workedHours: Math.round(workedHours),
    workedDays,
    lateMinutes,
    overtimeHours: Math.round(overtimeHours),
    approvedLeaveDays,
    advanceDeductions: Math.round(advanceDeductions),
    hourlyRate: hourlyRate.toFixed(2),
    netSalary: Math.round(netSalary),
  };
}
