"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  getBranchByIdAction,
  updateBranchAction,
} from "@/actions/branchActions";
import { getEmployeesAction } from "@/actions/employeeActions";
import {
  ArrowRight,
  Building2,
  MapPin,
  Users,
  Save,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default function AdminBranchDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { locale, id } = resolvedParams;
  const router = useRouter();

  const [branch, setBranch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employeeCount, setEmployeeCount] = useState<number>(0);

  // Form states
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [geofenceRadius, setGeofenceRadius] = useState("100");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    async function loadBranchData() {
      try {
        setLoading(true);
        const [bRes, empRes] = await Promise.all([
          getBranchByIdAction(id),
          getEmployeesAction(),
        ]);

        if (bRes.success && bRes.data) {
          const branchObj = bRes.data;
          setBranch(branchObj);
          setNameAr(branchObj.nameAr || "");
          setNameEn(branchObj.nameEn || "");
          setAddress(branchObj.address || "");
          setLatitude(branchObj.latitude || "");
          setLongitude(branchObj.longitude || "");
          setGeofenceRadius(
            String(branchObj.geofenceRadius || branchObj.radiusMeters || 100)
          );
          setIsActive(branchObj.isActive ?? true);

          if (empRes.success && Array.isArray(empRes.data)) {
            const count = empRes.data.filter(
              (e: any) => e.branchId === id
            ).length;
            setEmployeeCount(count);
          }
        } else {
          setError(bRes.error || "تعذر جلب بيانات الفرع");
        }
      } catch (err) {
        console.error("Error loading branch:", err);
        setError("حدث خطأ أثناء تحميل بيانات الفرع");
      } finally {
        setLoading(false);
      }
    }

    loadBranchData();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateBranchAction(id, {
        nameAr,
        nameEn,
        address,
        latitude,
        longitude,
        geofenceRadius: parseInt(geofenceRadius) || 100,
        radiusMeters: parseInt(geofenceRadius) || 100,
        isActive,
      });

      if (res.success) {
        toast.success("تم تحديث بيانات الفرع بنجاح");
        router.refresh();
      } else {
        toast.error(res.error || "فشل تحديث بيانات الفرع");
      }
    } catch (err) {
      toast.error("حدث خطأ غير متوقع أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

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
          href={`/${locale}/admin/branches`}
          className="inline-flex items-center px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent text-sm font-medium mb-4"
        >
          <BackIcon className="h-4 w-4 me-2" />
          العودة إلى الفروع
        </Link>
        <div className="p-6 rounded-xl border border-destructive/50 bg-destructive/10 text-center text-destructive font-medium">
          {error || "الفرع غير موجود"}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/admin/branches`}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-input bg-background hover:bg-accent transition-colors"
          >
            <BackIcon className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isRtl ? branch.nameAr : branch.nameEn}
            </h1>
            <p className="text-sm text-muted-foreground">
              تعديل وإدارة تفاصيل الفرع والنطاق الجغرافي
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {employeeCount} موظف
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-4">
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                البيانات الأساسية للفرع
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                أسماء الفرع والعنوان التفصيلي
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="nameAr" className="text-sm font-medium leading-none">
                  الاسم بالعربية *
                </label>
                <input
                  id="nameAr"
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  required
                  placeholder="فرع الرياض الرئيسي"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="nameEn" className="text-sm font-medium leading-none">
                  الاسم بالإنجليزية
                </label>
                <input
                  id="nameEn"
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="Riyadh Main Branch"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label htmlFor="address" className="text-sm font-medium leading-none">
                العنوان التفصيلي
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="طريق الملك فهد، العليا، الرياض"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-4">
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                الموقع الجغرافي ونطاق البصمة (Geofence)
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                إحداثيات GPS ونصف قطر النطاق المسموح لتسجيل الحضور
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="latitude" className="text-sm font-medium leading-none">
                  خط العرض (Latitude) *
                </label>
                <input
                  id="latitude"
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                  placeholder="24.7136"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="longitude" className="text-sm font-medium leading-none">
                  خط الطول (Longitude) *
                </label>
                <input
                  id="longitude"
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                  placeholder="46.6753"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label htmlFor="geofenceRadius" className="text-sm font-medium leading-none">
                نصف قطر النطاق الجغرافي (بالمتر) *
              </label>
              <input
                id="geofenceRadius"
                type="number"
                value={geofenceRadius}
                onChange={(e) => setGeofenceRadius(e.target.value)}
                required
                min="10"
                max="5000"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <p className="text-xs text-muted-foreground">
                المسافة القصوى المسموح بها للموظف للتبصيم بعيداً عن مركز الفرع.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-semibold border-b pb-3">حالة الفرع والحفظ</h2>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <label className="text-base font-medium cursor-pointer" htmlFor="isActiveToggle">
                  تفعيل الفرع
                </label>
                <p className="text-xs text-muted-foreground">
                  السماح للموظفين بالتبصيم في هذا الفرع
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="isActiveToggle"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 me-2" />
                  حفظ التغييرات
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
