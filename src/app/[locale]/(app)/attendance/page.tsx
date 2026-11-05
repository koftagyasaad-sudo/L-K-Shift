'use client';

import React, { useState, useEffect, use } from 'react';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

// دالة هافيرسين (Haversine) لحساب المسافة بدقة الأمتار بين إحداثيات الموظف وإحداثيات الفرع
function calculateDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // نصف قطر الأرض بالمتر
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default function SmartAttendancePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';

  const [userName, setUserName] = useState<string>('');
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [branchData, setBranchData] = useState<any>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // 1. جلب بيانات الموظف وفرعه المسند تلقائياً
  useEffect(() => {
    const storedName = localStorage.getItem('userName') || 'عمر عبدالحليم';
    setUserName(storedName);

    const fetchMyBranchInfo = async () => {
      try {
        setIsLoading(true);
        // البحث عن الموظف
        const empRes = await fetch('/api/employees', { cache: 'no-store' });
        if (!empRes.ok) throw new Error('فشل قراءة بيانات الموظف');
        const empList = await empRes.json();
        const me = Array.isArray(empList)
          ? empList.find((u: any) => u.name === storedName || u.fullName === storedName) || empList[0]
          : null;

        if (me) {
          setEmployeeData(me);
          if (me.branchId) {
            const branchRes = await fetch(`/api/branches?id=${me.branchId}`, { cache: 'no-store' });
            if (branchRes.ok) {
              const bInfo = await branchRes.json();
              setBranchData(bInfo);
            }
          }
        }
      } catch (err: any) {
        setStatusMessage({ text: err.message || 'فشل جلب بيانات الفرع', isError: true });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyBranchInfo();
  }, []);

  // 2. فحص الـ GPS وتسجيل البصمة الجغرافية
  const handleRecordAttendance = (type: 'CHECK_IN' | 'CHECK_OUT') => {
    setStatusMessage(null);

    if (!navigator.geolocation) {
      setStatusMessage({ text: 'متصفحك أو جهازك لا يدعم خاصية تحديد الموقع الجغرافي GPS', isError: true });
      return;
    }

    if (!branchData || !branchData.latitude || !branchData.longitude) {
      setStatusMessage({ text: 'لم يتم ربطك بفرع محدد أو إحداثيات الفرع غير مكتملة، تواصل مع الإدارة', isError: true });
      return;
    }

    setIsProcessing(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setCurrentCoords({ lat: userLat, lng: userLng });

        const branchLat = parseFloat(branchData.latitude);
        const branchLng = parseFloat(branchData.longitude);
        const maxRadius = parseInt(branchData.radiusMeters || branchData.geofenceRadius || '100', 10);

        // حساب المسافة الدقيقة بين الموظف والفرع
        const distance = calculateDistanceInMeters(userLat, userLng, branchLat, branchLng);
        setCurrentDistance(distance);

        // التحقق مما إذا كان الموظف داخل النطاق الجغرافي المحدد للفرع
        if (distance > maxRadius) {
          setIsProcessing(false);
          setStatusMessage({
            text: `عفواً، لا يمكنك تسجيل الحضور! أنت خارج نطاق الفرع (${branchData.nameAr || branchData.name}). المسافة الحالية: ${distance} متر، والحد المسموح به للبصمة هو: ${maxRadius} متر.`,
            isError: true,
          });
          return;
        }

        // إرسال تسجيل البصمة المعتمدة للخادم
        try {
          const payload = {
            userId: employeeData.id,
            branchId: branchData.id,
            type,
            latitude: userLat,
            longitude: userLng,
            distanceMeters: distance,
            isVerifiedGeofence: true,
          };

          const saveRes = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!saveRes.ok) throw new Error('فشل تسجيل البصمة في السيرفر');

          setStatusMessage({
            text: `تم تسجيل ${type === 'CHECK_IN' ? 'الحضور' : 'الانصراف'} بنجاح! الموقع مطابق للفرع بنسبة 100% (المسافة: ${distance} متر).`,
            isError: false,
          });
        } catch (err: any) {
          setStatusMessage({ text: err.message || 'حدث خطأ أثناء اعتماد البصمة', isError: true });
        } finally {
          setIsProcessing(false);
        }
      },
      (error) => {
        setIsProcessing(false);
        let errorMsg = 'تعذر الوصول لموقعك الجغرافي. يرجى تفعيل الـ GPS في جهازك والسماح للمتصفح بالوصول للموقع.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'تم رفض الإذن بالوصول للموقع الجغرافي. يرجى السماح بالموقع من إعدادات المتصفح.';
        }
        setStatusMessage({ text: errorMsg, isError: true });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80 sm:p-8">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
          {isRtl ? 'بوابة البصمة الذكية والحضور الميداني' : 'Smart Geofence Attendance'}
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {isRtl
            ? 'يقوم النظام تلقائياً بربطك بالفرع المسند والتحقق الفوري من إحداثيات موقعك'
            : 'Automatic branch geofence verification & distance check'}
        </p>

        {/* كارت الفرع المربوط بالموظف */}
        <div className="mt-6 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                {isRtl ? 'الفرع المسند إليك تلقائياً:' : 'Your Assigned Branch:'}
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {branchData ? branchData.nameAr || branchData.name : isRtl ? 'جاري قراءة الفرع...' : 'Loading branch...'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {branchData ? branchData.address || '—' : ''}
              </p>
            </div>
            <div className="text-right sm:text-left font-mono text-xs text-slate-600 dark:text-slate-300">
              <div>{isRtl ? 'النطاق المسموح للبصمة:' : 'Allowed Radius:'} <strong className="text-orange-600">{branchData ? (branchData.radiusMeters || 100) : 100} متر</strong></div>
              {currentDistance !== null && (
                <div className="mt-1">
                  {isRtl ? 'المسافة الحالية عن الفرع:' : 'Current Distance:'}{' '}
                  <strong className={currentDistance <= (branchData?.radiusMeters || 100) ? 'text-emerald-500' : 'text-rose-500'}>
                    {currentDistance} متر
                  </strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* رسائل التنبيه والنجاح */}
        {statusMessage && (
          <div
            className={`mt-6 rounded-xl p-4 text-xs font-bold ${
              statusMessage.isError
                ? 'border border-rose-500/30 bg-rose-50 text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400'
                : 'border border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* أزرار الحضور والانصراف المباشرة */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            disabled={isProcessing || isLoading || !branchData}
            onClick={() => handleRecordAttendance('CHECK_IN')}
            className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
          >
            <span className="text-3xl">📍</span>
            <span className="mt-2 text-lg font-black">{isRtl ? 'تسجيل حضور' : 'Check-In'}</span>
            <span className="text-[11px] opacity-80">{isRtl ? 'التحقق من التواجد داخل الفرع' : 'Verify branch location'}</span>
          </button>

          <button
            type="button"
            disabled={isProcessing || isLoading || !branchData}
            onClick={() => handleRecordAttendance('CHECK_OUT')}
            className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 p-6 text-white shadow-lg transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
          >
            <span className="text-3xl">🚪</span>
            <span className="mt-2 text-lg font-black">{isRtl ? 'تسجيل انصراف' : 'Check-Out'}</span>
            <span className="text-[11px] opacity-80">{isRtl ? 'اعتماد نهاية الشيفت' : 'Record end of shift'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
