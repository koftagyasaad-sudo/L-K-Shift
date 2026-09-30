export const permissionCatalog = [
  {
    category: "Employees",
    categoryAr: "الموظفون",
    items: [
      { id: "employees.view", label: "View employees", labelAr: "عرض الموظفين" },
      { id: "employees.manage", label: "Manage employees", labelAr: "إدارة الموظفين" },
    ],
  },
  {
    category: "Attendance",
    categoryAr: "الحضور",
    items: [
      { id: "attendance.view", label: "View attendance", labelAr: "عرض الحضور" },
      { id: "attendance.export", label: "Export attendance", labelAr: "تصدير الحضور" },
      { id: "attendance.override", label: "Manual overrides", labelAr: "تعديلات يدوية" },
    ],
  },
  {
    category: "Leaves",
    categoryAr: "الإجازات",
    items: [
      { id: "leaves.view", label: "View leave requests", labelAr: "عرض طلبات الإجازة" },
      { id: "leaves.approve", label: "Approve leave requests", labelAr: "اعتماد طلبات الإجازة" },
    ],
  },
  {
    category: "Roles",
    categoryAr: "الصلاحيات",
    items: [
      { id: "roles.view", label: "View roles", labelAr: "عرض الأدوار" },
      { id: "roles.manage", label: "Manage roles", labelAr: "إدارة الأدوار" },
    ],
  },
  {
    category: "Reports",
    categoryAr: "التقارير",
    items: [
      { id: "reports.view", label: "View reports", labelAr: "عرض التقارير" },
      { id: "reports.export", label: "Export reports", labelAr: "تصدير التقارير" },
    ],
  },
] as const;

export const allPermissionIds = permissionCatalog.flatMap((group) => group.items.map((item) => item.id));
