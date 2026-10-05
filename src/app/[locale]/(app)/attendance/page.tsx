import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { CheckInOutWidget } from "@/components/attendance/check-in-out-widget";

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect({ href: "/login", locale });
    return null;
  }

  const isAr = locale === "ar";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {isAr ? "تسجيل الحضور والانصراف" : "Attendance"}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {isAr ? "سجّل حضورك وانصرافك يوميًا من هذه الصفحة" : "Check in and out daily from this page"}
        </p>
      </div>

      <CheckInOutWidget locale={locale as "ar" | "en"} />
    </div>
  );
}
