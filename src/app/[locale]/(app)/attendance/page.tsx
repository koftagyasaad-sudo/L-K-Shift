'use client';

import React, { useState, useEffect, use } from 'react';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

// معادلة هافيرسين الميدانية لحساب المسافة بدقة المتر
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

  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [branchData, setBranchData] = useState<any>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // 1. تحميل الفرع المسند للموظف بدقة 100% من معرّفه
  const loadBranchInfo = async () => {
    try {
      setIsLoading(true);
      const storedId = localStorage.getItem('userId') || '';
      const storedName = localStorage.getItem('userName') || 'موظف';
      const storedBranchId = localStorage.getItem('userBranchId') || '';

      setUserId(storedId);
      setUserName(storedName);

      // الاستعلام بالمعرف الخاص بالموظف للتأكد من أحدث فرع مسند
      if (storedId) {
        const empRes = await fetch(`/api/employees?id=${storedId}`, { cache: 'no-store' });
        if (empRes.ok) {
          const emp = await empRes.json();
          const targetBranchId = emp.branchId || storedBranchId;
          if (targetBranchId) {
            const bRes = await fetch(`/api/branches?id=${targetBranchId}`, { cache: 'no-store' });
            if (bRes.ok) {
              const b = await bRes.json();
              setBranchData(b);
              return;
            }
          }
        }
      }

      // محاولة احتياطية بمعرف الفرع المخزن
      if (storedBranchId) {
        const bRes = await fetch(`/api/branches?id=${storedBranchId}`, { cache: 'no-store' });
        if (bRes.ok) {
          const b = await bRes.json();
          setBranchData(b);
        }
      }
    } catch (err: any) {
      console.error('Failed to load branch:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranchInfo();
  }, []);

  // 2. تحديث وفحص إشارة GPS وقراءة الموقع
  const handleRecordAttendance = (type: 'CHECK_IN' | 'CHECK_OUT') => {
    setStatusMessage(null);

    if (!navigator.geolocation) {
      setStatusMessage({ text: 'متصفحك لا يدعم خاصية تحديد الموقع الجغرافي GPS', isError: true });
      return;
    }

    if (!branchData || !branchData.latitude || !branchData.longitude) {
      setStatusMessage({
        text: 'لم يتم ربطك بفرع مسجل أو إحداثيات الفرع غير مكتملة، يرجى مراجعة إدارة المنظومة',
        isError: true,
      });
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

        // حساب المسافة الدقيقة بين الموظف وإحداثيات الفرع
        const distance = calculateDistanceInMeters(userLat, userLng, branchLat, branchLng);
        setCurrentDistance(distance);

        // التحقق من النطاق الجغرافي
        if (distance > maxRadius) {
          setIsProcessing(false);
          setStatusMessage({
            text: `عفواً، لا يمكنك تسجيل البصمة! أنت خارج نطاق فرع (${branchData.nameAr || branchData.name}). المسافة المقروءة: ${distance} متر (الحد الأقصى المسموح للبصمة: ${maxRadius} متر).`,
            isError: true,
          });
          return;
        }

        // إرسال البصمة المعتمدة
        try {
          const payload = {
            userId: userId || 1,
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
            text: `تم تسجيل ${type === 'CHECK_IN' ? 'الحضور' : 'الانصراف'} بنجاح! موقعك مطابق للفرع بنسبة 100% (المسافة: ${distance} متر عن نقطة الفرع).`,
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
        let errorMsg = 'تعذر الوصول للموقع الجغرافي. تأكد من تفعيل الـ GPS والسماح للمتصفح بالوصول للموقع.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'تم رفض الإذن بالوصول للموقع. يرجى تفعيل الموقع من إعدادات المتصفح.';
        }
        setStatusMessage({ text: errorMsg, isError: true });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              {isRtl ? 'تسجيل البصمة الذكية بالـ GPS' : 'Smart Geofence Attendance'}
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {isRtl ? `مرحباً بك: ${userName}` : `Welcome: ${userName}`}
            </p>
          </div>
          <button
            type="button"
            onClick={loadBranchInfo}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            {isRtl ? 'تحديث الفرع' : 'Reload Branch'}
          </button>
        </div>

        {/* كارت الفرع المربوط بالموظف وإحداثياته */}
        <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                {isRtl ? 'الفرع المسند إليك رسمياً:' : 'Your Assigned Branch:'}
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {branchData ? branchData.nameAr || branchData.name : isRtl ? 'جاري قراءة الفرع...' : 'Loading branch...'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {branchData?.address || (isRtl ? 'العنوان مسجل بالنظام' : 'Registered Address')}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/40 dark:bg-black/20 p-3 font-mono text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <div>
                <strong>{isRtl ? 'إحداثيات الفرع بالنظام:' : 'Branch GPS:'}</strong>
              </div>
              <div className="text-[11px] text-slate-500">
                Lat: {branchData?.latitude || '—'} | Lng: {branchData?.longitude || '—'}
              </div>
              <div className="text-[11px]">
                {isRtl ? 'نطاق السماح:' : 'Allowed Radius:'}{' '}
                <strong className="text-orange-600 font-bold">{branchData?.radiusMeters || 100} متر</strong>
              </div>
            </div>
          </div>

          {/* المسافة الحالية والموقع المقروء */}
          {currentCoords && (
            <div className="mt-4 pt-3 border-t border-orange-500/10 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-500">
                {isRtl ? 'موقعك المقروء حالياً:' : 'Your Location:'} Lat: {currentCoords.lat.toFixed(6)}, Lng: {currentCoords.lng.toFixed(6)}
              </span>
              {currentDistance !== null && (
                <span className="font-bold">
                  {isRtl ? 'المسافة عن نقطة الفرع:' : 'Distance:'}{' '}
                  <span
                    className={
                      currentDistance <= (branchData?.radiusMeters || 100)
                        ? 'text-emerald-500 text-sm'
                        : 'text-rose-500 text-sm'
                    }
                  >
                    {currentDistance} متر{' '}
                    {currentDistance <= (branchData?.radiusMeters || 100) ? '✓ (داخل النطاق)' : '✗ (خارج النطاق)'}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* رسائل التنبيه والنجاح */}
        {statusMessage && (
          <div
            className={`mt-6 rounded-xl p-4 text-xs font-bold leading-relaxed ${
              statusMessage.isError
                ? 'border border-rose-500/30 bg-rose-50 text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400'
                : 'border border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* أزرار الحضور والانصراف */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            disabled={isProcessing || isLoading || !branchData}
            onClick={() => handleRecordAttendance('CHECK_IN')}
            className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
          >
            <span className="text-3xl">📍</span>
            <span className="mt-2 text-lg font-black">{isRtl ? 'تسجيل حضور' : 'Check-In'}</span>
            <span className="text-[11px] opacity-80">{isRtl ? 'التحقق من التواجد بموقع الفرع' : 'Verify branch location'}</span>
          </button>

          <button
            type="button"
            disabled={isProcessing || isLoading || !branchData}
            onClick={() => handleRecordAttendance('CHECK_OUT')}
            className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 p-6 text-white shadow-lg transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
          >
            <span className="text-3xl">🚪</span>
            <span className="mt-2 text-lg font-black">{isRtl ? 'تسجيل انصراف' : 'Check-Out'}</span>
            <span className="text-[11px] opacity-80">{isRtl ? 'اعتماد نهاية ساعات العمل' : 'Record end of shift'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
