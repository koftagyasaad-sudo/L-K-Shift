// إرسال إشعار للمدير والمسؤولين بتسجيل الحضور أو الانصراف
try {
  const managers = await db.execute(sql`
    SELECT id FROM users 
    WHERE role IN ('SUPER_ADMIN', 'مدير النظام', 'مدير فرع')
      AND (primary_branch_id = ${branchId} OR role = 'مدير النظام' OR role = 'SUPER_ADMIN');
  `);
  const managerRows = Array.isArray(managers) ? managers : (managers as any)?.rows || [];
  
  const notifTitle = action === 'CHECK_IN' ? 'تسجيل حضور جديد' : 'تسجيل انصراف';
  const notifMsg = `سجل الموظف (${user.name || user.full_name_ar}) ${action === 'CHECK_IN' ? 'حضوره' : 'انصرافه'} بالفرع على بعد ${actualDistance}م.`;

  for (const m of managerRows) {
    await db.execute(sql`
      INSERT INTO notifications (user_id, sender_id, title, message, type, link, is_read, created_at)
      VALUES (${m.id}, ${userId}, ${notifTitle}, ${notifMsg}, 'ATTENDANCE', '/admin/attendance-review', false, NOW());
    `);
  }
} catch (notifErr) {
  console.error('Failed to dispatch attendance notification:', notifErr);
}
