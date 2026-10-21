"use client";

import { useEffect, useState, use } from "react";
import { getBranchByIdAction } from "@/actions/branchActions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
        <Button variant="outline" asChild className="mb-4">
          <Link href={`/${locale}/branches`}>
            <BackIcon className="h-4 w-4 me-2" />
            العودة للفروع
          </Link>
        </Button>
        <Card className="border-destructive">
          <CardContent className="pt-6 text-center text-destructive">
            {error || "الفرع غير موجود"}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/${locale}/branches`}>
            <BackIcon className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isRtl ? branch.nameAr : branch.nameEn}
          </h1>
          <p className="text-sm text-muted-foreground">{branch.address || "لا يوجد عنوان تفصيلي"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              معلومات الفرع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">الاسم بالعربية:</span>
              <span className="font-medium">{branch.nameAr}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">الاسم بالإنجليزية:</span>
              <span className="font-medium">{branch.nameEn}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">الحالة:</span>
              <span className={branch.isActive ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                {branch.isActive ? "نشط" : "غير نشط"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              النطاق الجغرافي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">الإحداثيات:</span>
              <span className="font-medium">{branch.latitude}, {branch.longitude}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">نصف قطر النطاق:</span>
              <span className="font-medium">{branch.geofenceRadius || branch.radiusMeters} متر</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
