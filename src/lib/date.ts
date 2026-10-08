// أدوات معالجة وتنسيق التواريخ الخاصة بحسابات الحضور والانصراف

/**
 * إرجاع بداية اليوم الحالي (ساعة 00:00:00)
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * إرجاع نهاية اليوم الحالي (ساعة 23:59:59)
 */
export function getEndOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * تنسيق التاريخ بصيغة ISO لتاريخ اليوم فقط (YYYY-MM-DD)
 */
export function formatDateToYMD(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * حساب الفرق بالدقائق بين وقتين
 */
export function getDifferenceInMinutes(startDate: Date, endDate: Date): number {
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.floor(diffMs / (1000 * 60));
}
