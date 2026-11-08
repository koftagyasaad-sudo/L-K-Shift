// المعادلة المحاسبية المعتمدة
const FIXED_MONTH_DAYS = 30; // الحساب الثابت على 30 يوماً
const dailyRate = basicSalary / FIXED_MONTH_DAYS;
const hourlyRate = dailyRate / workingHoursPerDay;
const minuteRate = hourlyRate / 60;

// خصومات التأخير
const lateDeduction = totalLateMinutes * minuteRate;

// بدل الإضافي (الوقت الإضافي يحسب بساعة ونصف 1.5x)
const overtimeBonus = totalOvertimeMinutes * minuteRate * 1.5;

// خصم أيام الغياب بدون إذن
const unexcusedAbsenceDeduction = unexcusedAbsentDaysCount * dailyRate;

// إجمالي السلف المعتمدة
const advanceDeductions = totalApprovedAdvances;

// صافي الراتب النهائي
const netSalary = Math.max(
  0,
  basicSalary + overtimeBonus - lateDeduction - unexcusedAbsenceDeduction - advanceDeductions
);
