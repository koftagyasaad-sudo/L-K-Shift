'use client';

import React, { useState, useEffect, use } from 'react';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

// دالة هافيرسين الميدانية لحساب المسافة بدقة الأمتار
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
  const [gpsLockProgress, setGpsLockProgress] = useState<string>('');

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // 1. تحميل الفرع المسند للموظف
  const initAttendance = async () => {
    try {
      setIsLoading(true);
      const sId = localStorage.getItem('userId') || '';
      const sName = localStorage.getItem('userName') || 'مستخدم المنظومة';
      const sRole = localStorage.getItem('userRole') || 'موظف';
      const sBranchId = localStorage.getItem('userBranchId') || '';

      setUserId(sId);
      setUserName(sName);
      setUserRole(sRole);

      const bRes = await fetch('/api/branches', { cache: 'no-store' });
      if (!bRes.ok) throw new Error('فشل جلب بيانات الفروع');
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

  // 2. خوارزمية الالتقاط الدقيق للأقمار الصناعية (Satellite GPS Lock Engine)
  const handleRecordAttendance = (type: 'CHECK_IN' | 'CHECK_OUT') => {
    setStatusMessage(null);

    if (!navigator.geolocation) {
      setStatusMessage({ text: 'متصفحك لا يدعم خاصية تحديد الموقع GPS', isError: true });
      return;
    }

    if (!currentBranch || !currentBranch.latitude || !currentBranch.longitude) {
      setStatusMessage({ text: 'إحداثيات الفرع غير مسجلة في المنظومة، يرجى مراجعة الإدارة', isError: true });
      return;
    }

    setIsProcessing(true);
    setGpsLockProgress(isRtl ? 'جاري الاتصال بالأقمار الصناعية وتصفية الإشارة...' : 'Acquiring high-accuracy GPS lock...');

    let bestPosition: GeolocationPosition | null = null;
    let attemptsCount = 0;

    // استخدام watchPosition لأخذ عينات متتالية واختيار أدق نقطة خلال 3 ثوانٍ
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        attemptsCount++;
        if (!bestPosition || pos.coords.accuracy < bestPosition.coords.accuracy) {
          bestPosition = pos;
        }

        // إذا وصلت دقة إشارة الـ GPS إلى أقل من 25 متراً أو بعد 3 قراءات نعتمد الموقع فوراً
        if (pos.coords.accuracy <= 25 || attemptsCount >= 3) {
          navigator.geolocation.clearWatch(watchId);
          processVerifiedAttendance(bestPosition || pos, type);
        }
      },
      (error) => {
        navigator.geolocation.clearWatch(watchId);
        setIsProcessing(false);
        setGpsLockProgress('');
        let errorMsg = 'تعذر الوصول للموقع. تأكد من تفعيل الـ GPS بالهاتف والسماح للمتصفح بالوصول للموقع بدقة عالية.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'تم رفض الإذن بالوصول للـ GPS. يرجى تفعيل إذن الموقع من إعدادات المتصفح.';
        }
        setStatusMessage({ text: errorMsg, isError: true });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // مهلة أمان قصوى 6 ثوانٍ لضمان عدم تعليق الزر
    setTimeout(() => {
      navigator.geolocation.clearWatch(watchId);
      if (isProcessing && bestPosition) {
        processVerifiedAttendance(bestPosition, type);
      } else if (isProcessing && !bestPosition) {
        setIsProcessing(false);
        setGpsLockProgress('');
        setStatusMessage({
          text: 'إشارة الـ GPS ضعيفة جداً حالياً. يرجى الخروج لمدخل الفرع أو الاقتراب من نافذة لتقوية الإشارة.',
          isError: true,
        });
      }
    }, 6000);
  };

  // 3. معالجة المسافة ومقارنة النطاق
  const processVerifiedAttendance = async (pos: GeolocationPosition, type: 'CHECK_IN' | 'CHECK_OUT') => {
    setIsProcessing(false);
    setGpsLockProgress('');

    const userLat = pos.coords.latitude;
    const userLng = pos.coords.longitude;
    const accuracy = Math.round(pos.coords.accuracy);

    setCurrentCoords({ lat: userLat, lng: userLng });
    setGpsAccuracy(accuracy);

    const branchLat = parseFloat(currentBranch.latitude);
    const branchLng = parseFloat(currentBranch.longitude);
    const maxRadius = parseInt(currentBranch.radiusMeters || currentBranch.geofenceRadius || '100', 10);

    // حساب المسافة الحقيقية
    const rawDistance = calculateDistanceInMeters(userLat, userLng, branchLat, branchLng);
    setCurrentDistance(rawDistance);

    // احتساب هامش دقة الجهاز (Buffer Margin): لإنصاف الموظف في حال ضعف برج الاتصال
    const effectiveDistance = Math.max(0, rawDistance - Math.min(accuracy / 2, 25));

    if (effectiveDistance > maxRadius) {
      setStatusMessage({
        text: `عفواً، لا يمكنك تسجيل البصمة! أنت خارج نطاق فرع (${currentBranch.nameAr || currentBranch.name}). المسافة المحسوبة: ${rawDistance} متر (النطاق المسموح: ${maxRadius} متر). تأكد من وجودك داخل الفرع.`,
        isError: true,
      });
      return;
    }

    try {
      const payload = {
        userId: userId ? parseInt(userId, 10) : 1,
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

      if (!saveRes.ok) throw new Error('فشل تسجيل البصمة في السيرفر');

      setStatusMessage({
        text: `تم تسجيل ${type === 'CHECK_IN' ? 'الحضور' : 'الانصراف'} بنجاح تام! موقعك مطابق للفرع بنسبة 100% (المسافة: ${rawDistance} متر | دقة الإشارة: ±${accuracy}م).`,
        isError: false,
      });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'حدث خطأ أثناء اعتماد البصمة', isError: true });
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

          {/* لوحة المقارنة الحية للأقمار الصناعية */}
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

              {/* زر المقارنة البصرية المباشرة على خرائط جوجل */}
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

        {/* مؤشر تقدم قفل الأقمار الصناعية */}
        {gpsLockProgress && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 text-xs font-bold text-orange-600 dark:text-orange-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            <span>{gpsLockProgress}</span>
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

        {/* أزرار الحضور والانصراف */}
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
