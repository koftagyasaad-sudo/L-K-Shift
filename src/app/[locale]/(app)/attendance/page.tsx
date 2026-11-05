'use client';

import React, { useState, useEffect, use } from 'react';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

// معادلة هافيرسين الميدانية لحساب المسافة بدقة الأمتار
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
  const [userRole, setUserRole] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [currentBranch, setCurrentBranch] = useState<any>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [loadingStepText, setLoadingStepText] = useState<string>('');

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // 1. تحميل الفرع المسند للموظف بدقة
  const initAttendance = async () => {
    try {
      setIsLoading(true);
      const sId = localStorage.getItem('userId') || '1';
      const sName = localStorage.getItem('userName') || 'مستخدم المنظومة';
      const sRole = localStorage.getItem('userRole') || 'موظف';
      const sBranchId = localStorage.getItem('userBranchId') || '';

      setUserId(sId);
      setUserName(sName);
      setUserRole(sRole);

      const bRes = await fetch('/api/branches', { cache: 'no-store' });
      if (!bRes.ok) throw new Error('فشل جلب قائمة الفروع');
      const bData = await bRes.json();
      const list = Array.isArray(bData) ? bData : [];
      setBranchesList(list);

      let activeBranch = null;
      if (sBranchId) {
        activeBranch = list.find((b: any) => String(b.id) === String(sBranchId));
      }

      if (!activeBranch && list.length > 0) {
        activeBranch = list[0];
      }

      if (activeBranch) {
        setSelectedBranchId(String(activeBranch.id));
        setCurrentBranch(activeBranch);
      }
    } catch (err: any) {
      console.error('Error init attendance:', err);
      setStatusMessage({ text: 'حدث خطأ أثناء تحميل بيانات الفروع', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAttendance();
  }, []);

  const handleBranchChange = (newBranchId: string) => {
    setSelectedBranchId(newBranchId);
    const found = branchesList.find((b) => String(b.id) === String(newBranchId));
    if (found) {
      setCurrentBranch(found);
      setCurrentCoords(null);
      setCurrentDistance(null);
      setGpsAccuracy(null);
      setStatusMessage(null);
    }
  };

  // 2. خوارزمية الالتقاط الفوري الصامت (بدون تعليق وبدون انتظار دقة مستحيلة)
  const handleRecordAttendance = (type: 'CHECK_IN' | 'CHECK_OUT') => {
    setStatusMessage(null);

    if (!navigator.geolocation) {
      setStatusMessage({ text: 'متصفحك لا يدعم خاصية تحديد الموقع GPS', isError: true });
      return;
    }

    if (!currentBranch || !currentBranch.latitude || !currentBranch.longitude) {
      setStatusMessage({ text: 'إحداثيات الفرع غير مسجلة بالنظام، يرجى مراجعة إدارة المنظومة', isError: true });
      return;
    }

    setIsProcessing(true);
    setLoadingStepText(isRtl ? 'جاري قراءة إحداثيات الموقع الحالي...' : 'Reading GPS coordinates...');

    // محاولة دقيقة أولى بمهلة 4 ثوانٍ فقط لمنع التعليق
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        executeAttendanceProcess(pos, type);
      },
      (error) => {
        console.warn('High-accuracy GPS delayed, switching to instant network location:', error.message);
        setLoadingStepText(isRtl ? 'جاري تأكيد الموقع عبر برج الاتصال المتاح...' : 'Switching to cell network GPS...');

        // خطة الإنقاذ الفورية (Fallback): قراءة الموقع فوراً دون إقفال عالي الدقة
        navigator.geolocation.getCurrentPosition(
          (fallbackPos) => {
            executeAttendanceProcess(fallbackPos, type);
          },
          (finalError) => {
            setIsProcessing(false);
            setLoadingStepText('');
            let errorMsg = 'تعذر الوصول للموقع. تأكد من تفعيل الـ GPS والسماح للمتصفح بالوصول للموقع.';
            if (finalError.code === finalError.PERMISSION_DENIED) {
              errorMsg = 'تم رفض إذن الوصول للموقع. يرجى تفعيل إذن الموقع من إعدادات المتصفح.';
            }
            setStatusMessage({ text: errorMsg, isError: true });
          },
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 4000, maximumAge: 10000 }
    );
  };

  // 3. احتساب المسافة والتسجيل في السيرفر
  const executeAttendanceProcess = async (pos: GeolocationPosition, type: 'CHECK_IN' | 'CHECK_OUT') => {
    setLoadingStepText(isRtl ? 'جاري التحقق من النطاق واعتماد البصمة...' : 'Verifying geofence & recording...');

    const userLat = pos.coords.latitude;
    const userLng = pos.coords.longitude;
    const accuracy = Math.round(pos.coords.accuracy || 20);

    setCurrentCoords({ lat: userLat, lng: userLng });
    setGpsAccuracy(accuracy);

    const branchLat = parseFloat(currentBranch.latitude);
    const branchLng = parseFloat(currentBranch.longitude);
    const maxRadius = parseInt(currentBranch.radiusMeters || currentBranch.geofenceRadius || '100', 10);

    // حساب المسافة الحقيقية
    const rawDistance = calculateDistanceInMeters(userLat, userLng, branchLat, branchLng);
    setCurrentDistance(rawDistance);

    // احتساب هامش ضعف الإشارة داخل المباني والمكاتب
    const effectiveDistance = Math.max(0, rawDistance - Math.min(accuracy / 2, 35));

    if (effectiveDistance > maxRadius) {
      setIsProcessing(false);
      setLoadingStepText('');
      setStatusMessage({
        text: `عفواً، لا يمكنك تسجيل البصمة! أنت خارج نطاق فرع (${currentBranch.nameAr || currentBranch.name}). المسافة: ${rawDistance} متر (الحد المسموح للفرع: ${maxRadius} متر).`,
        isError: true,
      });
      return;
    }

    try {
      const payload = {
        userId: userId || '1',
        branchId: currentBranch.id,
        type,
        latitude: userLat,
        longitude: userLng,
        distanceMeters: rawDistance,
        isVerifiedGeofence: true,
      };

      const saveRes = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await saveRes.json().catch(() => ({}));

      if (!saveRes.ok) {
        throw new Error(resData.message || 'فشل حفظ البصمة في السيرفر');
      }

      setStatusMessage({
        text: `تم تسجيل ${type === 'CHECK_IN' ? 'الحضور' : 'الانصراف'} بنجاح تام! موقعك مطابق للفرع بنسبة 100% (المسافة: ${rawDistance} متر | دقة الإشارة: ±${accuracy}م).`,
        isError: false,
      });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'حدث خطأ أثناء اعتماد البصمة بالسيرفر', isError: true });
    } finally {
      setIsProcessing(false);
      setLoadingStepText('');
    }
  };

  const isAdmin = userRole === 'مدير النظام' || userRole === 'SUPER_ADMIN' || userRole === 'admin';

  return (
    <div className="space-y-6 max-w-4xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              {isRtl ? 'تسجيل البصمة الذكية بالـ GPS' : 'Smart Geofence Attendance'}
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {isRtl ? `المستخدم المسجل: ${userName}` : `User: ${userName}`}
            </p>
          </div>
          <button
            type="button"
            onClick={initAttendance}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 cursor-pointer"
          >
            {isRtl ? 'تحديث الفرع' : 'Reload Branch'}
          </button>
        </div>

        {/* كارت الفرع المعتمد ومقارنة الإحداثيات */}
        <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                {isAdmin
                  ? (isRtl ? 'اختر الفرع لتسجيل الحضور / الاختبار:' : 'Select Branch to Test:')
                  : (isRtl ? 'الفرع المسند إليك رسمياً:' : 'Your Assigned Branch:')}
              </span>

              {isAdmin ? (
                <div className="mt-1.5">
                  <select
                    value={selectedBranchId}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    className="rounded-xl border border-orange-500/30 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                  >
                    {branchesList.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {b.nameAr || b.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {currentBranch ? (currentBranch.nameAr || currentBranch.name) : (isRtl ? 'جاري التحميل...' : 'Loading...')}
                </h3>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {currentBranch?.address || (isRtl ? 'العنوان مسجل بالنظام' : 'Registered Address')}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/50 dark:bg-black/30 p-3 font-mono text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <div>
                <strong>{isRtl ? 'إحداثيات الفرع المسجلة:' : 'Branch GPS:'}</strong>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                Lat: {currentBranch?.latitude || '—'} | Lng: {currentBranch?.longitude || '—'}
              </div>
              <div className="text-[11px]">
                {isRtl ? 'نطاق السماح للبصمة:' : 'Allowed Radius:'}{' '}
                <strong className="text-orange-600 font-bold">{currentBranch?.radiusMeters || currentBranch?.geofenceRadius || 100} متر</strong>
              </div>
            </div>
          </div>

          {/* لوحة المقارنة الحية */}
          {currentCoords && (
            <div className="mt-4 pt-3 border-t border-orange-500/10 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-300">
                  {isRtl ? 'موقعك الفعلي (GPS):' : 'Your GPS:'} <strong>{currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}</strong>
                  {gpsAccuracy !== null && (
                    <span className="mr-2 inline-flex rounded bg-slate-200 dark:bg-white/10 px-2 py-0.5 text-[10px] text-slate-700 dark:text-slate-300">
                      دقة الإشارة: ±{gpsAccuracy}م
                    </span>
                  )}
                </span>

                {currentDistance !== null && (
                  <span className="font-bold">
                    {isRtl ? 'المسافة عن الفرع:' : 'Distance:'}{' '}
                    <span
                      className={
                        currentDistance <= (currentBranch?.radiusMeters || currentBranch?.geofenceRadius || 100)
                          ? 'text-emerald-500 text-sm font-black'
                          : 'text-rose-500 text-sm font-black'
                      }
                    >
                      {currentDistance} متر{' '}
                      {currentDistance <= (currentBranch?.radiusMeters || currentBranch?.geofenceRadius || 100)
                        ? '✓ (داخل النطاق)'
                        : '✗ (خارج النطاق)'}
                    </span>
                  </span>
                )}
              </div>

              {currentBranch?.latitude && (
                <div className="pt-1">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${currentCoords.lat},${currentCoords.lng}&destination=${currentBranch.latitude},${currentBranch.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    <span>🗺️ {isRtl ? 'عرض خط المسافة بينك وبين الفرع على Google Maps' : 'View route on Google Maps'}</span>
                    <span>&larr;</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* مؤشر التحميل السلس */}
        {loadingStepText && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 text-xs font-bold text-orange-600 dark:text-orange-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            <span>{loadingStepText}</span>
          </div>
        )}

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

        {/* أزرار الحضور والانصراف المباشرة */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            disabled={isProcessing || isLoading || !currentBranch}
            onClick={() => handleRecordAttendance('CHECK_IN')}
            className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
          >
            <span className="text-3xl">📍</span>
            <span className="mt-2 text-lg font-black">{isRtl ? 'تسجيل حضور' : 'Check-In'}</span>
            <span className="text-[11px] opacity-80">{isRtl ? 'تأكيد التواجد داخل الفرع' : 'Verify branch location'}</span>
          </button>

          <button
            type="button"
            disabled={isProcessing || isLoading || !currentBranch}
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
