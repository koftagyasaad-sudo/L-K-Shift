"use client";

import React, { useState } from "react";

interface EmployeeAttendanceRecord {
  id: number;
  employeeName: string;
  performanceId: string; // رقم الأداء
  phone: string;
  branchName: string;
  checkInTime: string;
  checkOutTime?: string;
  status: string;
}

interface EmployeesSearchExportProps {
  data: EmployeeAttendanceRecord[];
}

export default function EmployeesSearchExport({ data }: EmployeesSearchExportProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // فلترة البيانات بناءً على الاسم، رقم الأداء، رقم الهاتف، والفترة الزمنية
  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.performanceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone.includes(searchTerm);

    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(item.checkInTime) >= new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(item.checkInTime) <= end;
    }

    return matchesSearch && matchesDate;
  });

  // تصدير البيانات إلى شيت Excel (صيغة CSV تدعم العربية UTF-8)
  const exportToExcel = () => {
    if (filteredData.length === 0) {
      alert("لا توجد بيانات لتصديرها");
      return;
    }

    // رؤوس الأعمدة
    const headers = [
      "اسم الموظف",
      "رقم الأداء",
      "رقم الهاتف",
      "الفرع",
      "وقت الحضور",
      "وقت الانصراف",
      "الحالة",
    ];

    // تحويل البيانات إلى أسطر
    const rows = filteredData.map((item) => [
      `"${item.employeeName}"`,
      `"${item.performanceId}"`,
      `"${item.phone}"`,
      `"${item.branchName}"`,
      `"${new Date(item.checkInTime).toLocaleString("ar-EG")}"`,
      item.checkOutTime ? `"${new Date(item.checkOutTime).toLocaleString("ar-EG")}"` : '"-"',
      `"${item.status}"`,
    ]);

    // دمج الرؤوس مع الصفوف مع إضافة BOM لتشفير اللغة العربية بنجاح في Excel
    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_الحضور_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-5 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 text-right dir-rtl space-y-4">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
        البحث وفلترة سجلات الموظفين وتصدير البيانات
      </h3>

      {/* خيارات الفلترة والبحث */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
            بحث (الاسم / رقم الأداء / الهاتف)
          </label>
          <input
            type="text"
            placeholder="ادخل الاسم أو رقم الأداء..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
            من تاريخ
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
            إلى تاريخ
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>
      </div>

      {/* أزرار العمليات ملخصة */}
      <div className="flex justify-between items-center pt-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          عدد النتائج: <strong className="text-slate-800 dark:text-slate-200">{filteredData.length}</strong> سجل
        </span>

        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
        >
          📊 تصدير إلى Excel (CSV)
        </button>
      </div>

      {/* جدول عرض النتائج المفلترة */}
      <div className="overflow-x-auto mt-4 border rounded-lg">
        <table className="w-full text-sm text-right text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b">
            <tr>
              <th className="p-3">اسم الموظف</th>
              <th className="p-3">رقم الأداء</th>
              <th className="p-3">رقم الهاتف</th>
              <th className="p-3">الفرع</th>
              <th className="p-3">وقت الحضور</th>
              <th className="p-3">وقت الانصراف</th>
              <th className="p-3">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">{item.employeeName}</td>
                  <td className="p-3">{item.performanceId}</td>
                  <td className="p-3">{item.phone}</td>
                  <td className="p-3">{item.branchName}</td>
                  <td className="p-3">{new Date(item.checkInTime).toLocaleString("ar-EG")}</td>
                  <td className="p-3">
                    {item.checkOutTime ? new Date(item.checkOutTime).toLocaleString("ar-EG") : "-"}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 text-xs font-bold rounded-md bg-green-100 text-green-800">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-4 text-center text-slate-400">
                  لا توجد نتائج تطابق البحث
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
