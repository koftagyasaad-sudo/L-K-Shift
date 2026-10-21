"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  getBranchByIdAction,
  updateBranchAction,
} from "@/actions/branchActions";
import { getEmployeesAction } from "@/actions/employeeActions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
        <Button variant="outline" asChild className="mb-4">
          <Link href={`/${locale}/admin/branches`}>
            <BackIcon className="h-4 w-4 me-2" />
            العودة إلى الفروع
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/${locale}/admin/branches`}>
              <BackIcon className="h-4 w-4" />
            </Link>
          </Button>
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
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {employeeCount} موظف
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                البيانات الأساسية للفرع
              </CardTitle>
              <CardDescription>أسماء الفرع والعنوان التفصيلي</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nameAr">الاسم بالعربية *</Label>
                  <Input
                    id="nameAr"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    required
                    placeholder="فرع الرياض الرئيسي"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameEn">الاسم بالإنجليزية</Label>
                  <Input
                    id="nameEn"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="Riyadh Main Branch"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">العنوان التفصيلي</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="طريق الملك فهد، العليا، الرياض"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                الموقع الجغرافي ونطاق البصمة (Geofence)
              </CardTitle>
              <CardDescription>إحداثيات GPS ونصف قطر النطاق المسموح لتسجيل الحضور</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">خط العرض (Latitude) *</Label>
                  <Input
                    id="latitude"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    required
                    placeholder="24.7136"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">خط الطول (Longitude) *</Label>
                  <Input
                    id="longitude"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    required
                    placeholder="46.6753"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="geofenceRadius">نصف قطر النطاق الجغرافي (بالمتر) *</Label>
                <Input
                  id="geofenceRadius"
                  type="number"
                  value={geofenceRadius}
                  onChange={(e) => setGeofenceRadius(e.target.value)}
                  required
                  min="10"
                  max="5000"
                />
                <p className="text-xs text-muted-foreground">
                  المسافة القصوى المسموح بها للموظف للتبصيم بعيداً عن مركز الفرع.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">حالة الفرع والحفظ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="space-y-0.5">
                  <Label className="text-base">تفعيل الفرع</Label>
                  <p className="text-xs text-muted-foreground">
                    السماح للموظفين بالتبصيم في هذا الفرع
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              <Button type="submit" disabled={saving} className="w-full">
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
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
