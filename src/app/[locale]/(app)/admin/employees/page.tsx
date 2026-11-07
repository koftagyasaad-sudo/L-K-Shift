{/* أزرار الإجراءات داخل كل صف موظف */}
<div className="flex items-center justify-center gap-2">
  <Link
    href={`/${locale}/admin/employees/${emp.id}/zk-sheet`}
    className="rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 px-2.5 py-1.5 text-xs font-bold transition flex items-center gap-1"
    title="تفريغ شيت ZK ومسير الرواتب"
  >
    📄 شيت الحضور
  </Link>

  <Link
    href={`/${locale}/admin/employees/${emp.id}/dossier`}
    className="rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 px-2.5 py-1.5 text-xs font-bold transition flex items-center gap-1"
    title="ملف الموظف للـ HR والتحكم بالأمان"
  >
    👤 ملف الـ HR
  </Link>

  <button
    type="button"
    onClick={() => handleEditClick(emp)}
    className="rounded-xl border border-slate-300 bg-white dark:bg-white/5 dark:border-white/10 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
  >
    ✏️ تعديل
  </button>
</div>
