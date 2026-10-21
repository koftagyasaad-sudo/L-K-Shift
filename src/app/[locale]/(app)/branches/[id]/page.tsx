"use client";

import { useEffect, useState, use } from "react";
import { getBranchByIdAction } from "@/actions/branchActions";
import { ArrowRight, Building2, MapPin, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default function BranchDetailsViewPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { locale, id } = resolvedParams;

  const [branch, setBranch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBranch() {
      try {
        setLoading(true);
        const res = await getBranchByIdAction(id);
        if (res.success && res.data) {
          setBranch(res.data);
        } else {
          setError(res.error || "الفرع غير موجود");
        }
      } catch (err) {
        setError("حدث خطأ أثناء تحميل الفرع");
      } finally {
        setLoading(false);
      }
    }
    loadBranch();
  }, [id]);

  const isRtl = locale === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Link
          href={`/${locale}/branches`}
          className="inline-flex items-center px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent text-sm font-medium mb-4"
        >
          <BackIcon className="h-4 w-4 me-2" />
          العودة للفروع
        </Link>
        <div className="p-6 rounded-xl border border-destructive/50 bg-destructive/10 text-center text-destructive font-medium">
          {error || "الفرع غير موجود"}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/branches`}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-input bg-background hover:bg-accent transition-colors"
        >
          <BackIcon className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isRtl ? branch.nameAr : branch.nameEn}
          </h1>
          <p className="text-sm text-muted-foreground">{branch.address || "لا يوجد عنوان تفصيلي"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              معلومات الفرع
            </h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2 text-sm">
              <span className="text-muted-foreground">الاسم بالعربية:</span>
              <span className="font-medium">{branch.nameAr}</span>
            </div>
            <div className="flex justify-between border-b pb-2 text-sm">
              <span className="text-muted-foreground">الاسم بالإنجليزية:</span>
              <span className="font-medium">{branch.nameEn}</span>
            </div>
            <div className="flex justify-between border-b pb-2 text-sm">
              <span className="text-muted-foreground">الحالة:</span>
              <span className={branch.isActive ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                {branch.isActive ? "نشط" : "غير نشط"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-4">
          <div className="border-b pb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              النطاق الجغرافي
            </h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2 text-sm">
              <span className="text-muted-foreground">الإحداثيات:</span>
              <span className="font-medium">{branch.latitude}, {branch.longitude}</span>
            </div>
            <div className="flex justify-between border-b pb-2 text-sm">
              <span className="text-muted-foreground">نصف قطر النطاق:</span>
              <span className="font-medium">{branch.geofenceRadius || branch.radiusMeters} متر</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
