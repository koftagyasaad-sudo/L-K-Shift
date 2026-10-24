"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  getBranchByIdAction,
  updateBranchAction,
} from "@/actions/branchActions";

function extractCoordinatesFromUrl(url: string): { lat: string; lng: string } | null {
  if (!url) return null;

  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: atMatch[1], lng: atMatch[2] };
  }

  const qMatch = url.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return { lat: qMatch[1], lng: qMatch[2] };
  }

  const searchMatch = url.match(/search\/(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (searchMatch) {
    return { lat: searchMatch[1], lng: searchMatch[2] };
  }

  const directMatch = url.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (directMatch) {
    return { lat: directMatch[1], lng: directMatch[2] };
  }

  return null;
}

export default function EditBranchPage() {
  const router = useRouter();
  const routeParams = useParams();
  const branchId = String(routeParams?.id || "");

  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radiusMeters, setRadiusMeters] = useState(100);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [managerName, setManagerName] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!branchId) return;

    let isMounted = true;
    async function loadBranch() {
      try {
        setLoading(true);
        const data = await getBranchByIdAction(branchId);
        if (!isMounted) return;

        if (data) {
          setNameAr(data.nameAr || data.name || "");
          setNameEn(data.nameEn || "");
          setAddress(data.address || "");
          setLatitude(
            data.latitude !== null && data.latitude !== undefined
              ? String(data.latitude)
              : ""
          );
          setLongitude(
            data.longitude !== null && data.longitude !== undefined
              ? String(data.longitude)
              : ""
          );
          setRadiusMeters(
            typeof data.radiusMeters === "number"
              ? data.radiusMeters
              : typeof data.geofenceRadius === "number"
                ? data.geofenceRadius
                : 100
          );
          setIsActive(data.isActive !== false && data.isActive !== null && data.isActive !== undefined);
          setGoogleMapsUrl(data.googleMapsUrl || "");
          setPhone(data.phone || "");
          setManagerName(data.managerName || "");
        } else {
          setError("لم يتم العثور على الفرع المطلوب");
        }
      } catch (e: any) {
        if (isMounted) setError(e?.message || "حدث خطأ أثناء تحميل بيانات الفرع");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBranch();
    return () => {
      isMounted = false;
    };
  }, [branchId]);

  function handleMapsUrlChange(url: string) {
    setGoogleMapsUrl(url);
    const coords = extractCoordinatesFromUrl(url);
    if (coords) {
      setLatitude(coords.lat);
      setLongitude(coords.lng);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!nameAr.trim()) {
      setError("يرجى إدخال اسم الفرع باللغة العربية");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          id: branchId,
          name: nameAr.trim(),
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim(),
          address: address.trim(),
          latitude: latitude.trim() ? parseFloat(latitude.trim()) : null,
          longitude: longitude.trim() ? parseFloat(longitude.trim()) : null,
          geofenceRadius: Number(radiusMeters) || 100,
          radiusMeters: Number(radiusMeters) || 100,
          isActive,
          googleMapsUrl: googleMapsUrl.trim(),
          phone: phone.trim(),
          managerName: managerName.trim(),
        };

        const res = await updateBranchAction(branchId, payload);
        if (res && res.success === false) {
          setError(res.error || "فشل حفظ بيانات الفرع");
          return;
        }

        setMessage("تم تحديث بيانات الفرع بنجاح");
        setTimeout(() => {
          router.push("/admin/branches");
          router.refresh();
        }, 1000);
      } catch (err: any) {
        setError(err?.message || "حدث خطأ أثناء حفظ التعديلات");
      }
    });
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500" dir="rtl">
        جاري تحميل بيانات الفرع...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">تعديل بيانات الفرع</h1>
          <p className="mt-1 text-sm text-slate-500">
            تحديث اسم وموقع ونطاق التحقق الجغرافي للفرع
          </p>
        </div>
        <Link
          href="/admin/branches"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          العودة للفروع
        </Link>
      </div>

      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              اسم الفرع بالعربي <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="مثال: فرع الرياض الرئيسي"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none ring-blue-500 focus:ring-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              اسم الفرع بالإنجليزي
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Main Branch"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none ring-blue-500 focus:ring-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              اسم المدير / المشرف
            </label>
            <input
              type="text"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              placeholder="اسم مدير الفرع"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none ring-blue-500 focus:ring-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              رقم هاتف الفرع
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XXXXXXXX"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none ring-blue-500 focus:ring-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            العنوان النصي
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="المدينة، الحي، الشارع..."
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none ring-blue-500 focus:ring-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            رابط Google Maps (يستخرج الإحداثيات تلقائياً)
          </label>
          <input
            type="url"
            value={googleMapsUrl}
            onChange={(e) => handleMapsUrlChange(e.target.value)}
            placeholder="https://maps.google.com/..."
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none ring-blue-500 focus:ring-2"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              خط العرض (Latitude)
            </label>
            <input
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="24.7136"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none ring-blue-500 focus:ring-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              خط الطول (Longitude)
            </label>
            <input
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="46.6753"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none ring-blue-500 focus:ring-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              نصف قطر GPS (متر)
            </label>
            <input
              type="number"
              min={10}
              max={5000}
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none ring-blue-500 focus:ring-2"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-slate-800">
            تفعيل الفرع (السماح بتسجيل الحضور والانصراف فيه)
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Link
            href="/admin/branches"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            إلغاء
          </Link>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </form>
    </div>
  );
}
