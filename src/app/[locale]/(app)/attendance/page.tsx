'use client';

import React, { useState, useEffect, use } from 'react';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

function calculateDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
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

  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');

  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [currentBranch, setCurrentBranch] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStepText, setLoadingStepText] = useState('');

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // حالة الاتصال وطابور الأوفلاين
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);

  // تحديث عداد الحركات المحفوظة أوفلاين
  const refreshOfflineCount = () => {
    try {
      const q = JSON.parse(localStorage.getItem('offlineAttendanceQueue') || '[]');
      setOfflineQueueCount(q.length);
    } catch {
      setOfflineQueueCount(0);
    }
  };

  // مزامنة طابور الأوفلاين فور عودة الاتصال
  const syncOfflineQueue = async () => {
    try {
      const q = JSON.parse(localStorage.getItem('offlineAttendanceQueue') || '[]');
      if (q.length === 0) return;

      for (const item of q) {
        await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...item, isOfflineSynced: true }),
        });
      }

      localStorage.removeItem('offlineAttendanceQueue');
      setOfflineQueueCount(0);
      setStatusMessage({ text: '✓ تم بنجاح مزامنة ورفع البصمات المسجلة في وضع عدم الاتصال!', isError: false });
    } catch (err) {
      console.error('Failed to sync offline queue:', err);
    }
  };

  useEffect(() => {
    setIsOnline(navigator.onLine);
    refreshOfflineCount();

    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

      // إذا كان أوفلاين نقرأ الفروع المخزنة محلياً
      const cachedBranches = localStorage.getItem('cachedBranches');
      if (!navigator.onLine && cachedBranches) {
        const list = JSON.parse(cachedBranches);
        setBranchesList(list);
        if (list.length > 0) {
          const act = list.find((b: any) => String(b.id) === String(sBranchId)) || list[0];
          setSelectedBranchId(String(act.id));
          setCurrentBranch(act);
        }
        setIsLoading(false);
        return;
      }

      const bRes = await fetch('/api/branches', { cache: 'no-store' });
      if (bRes.ok) {
        const bData = await bRes.json();
        const list = Array.isArray(bData) ? bData : [];
        setBranchesList(list);
        localStorage.setItem('cachedBranches', JSON.stringify(list));

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
      }
    } catch (err) {
      console.error('Error init attendance:', err);
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
      setStatusMessage(null);
    }
  };

  // تسجيل البصمة (يدعم أونلاين وأوفلاين)
  const handleRecordAttendance = (type: 'CHECK_IN' | 'CHECK_OUT') => {
    setStatusMessage(null);

    if (!navigator.geolocation) {
      setStatusMessage({ text: 'المتصفح لا يدعم تحديد الموقع GPS', isError: true });
      return;
    }

    if (!currentBranch || !currentBranch.latitude || !currentBranch.longitude) {
      setStatusMessage({ text: 'إحداثيات الفرع غير مسجلة بالنظام', isError: true });
      return;
    }

    setIsProcessing(true);
    setLoadingStepText(isRtl ? 'جاري قراءة إحداثيات الموقع الحالي...' : 'Reading GPS...');

    navigator.geolocation.getCurrentPosition(
      (pos) => executeAttendanceProcess(pos, type),
      () => {
        navigator.geolocation.getCurrentPosition(
          (fallbackPos) => executeAttendanceProcess(fallbackPos, type),
          (err) => {
            setIsProcessing(false);
            setLoadingStepText('');
            setStatusMessage({ text: 'تعذر الوصول للـ GPS، يرجى تفعيل الموقع بالهاتف', isError: true });
          },
          { enableHighAccuracy: false, timeout: 6000 }
        );
      },
      { enableHighAccuracy: true, timeout: 4000 }
    );
  };

  const executeAttendanceProcess = async (pos: GeolocationPosition, type: 'CHECK_IN' | 'CHECK_OUT') => {
    const userLat = pos.coords.latitude;
    const userLng = pos.coords.longitude;
    const accuracy = Math.round(pos.coords.accuracy || 20);

    setCurrentCoords({ lat: userLat, lng: userLng });
    setGpsAccuracy(accuracy);

    const branchLat = parseFloat(currentBranch.latitude);
    const branchLng = parseFloat(currentBranch.longitude);
    const maxRadius = parseInt(currentBranch.radiusMeters || currentBranch.geofenceRadius || '100', 10);

    const rawDistance = calculateDistanceInMeters(userLat, userLng, branchLat, branchLng);
    setCurrentDistance(rawDistance);

    const effectiveDistance = Math.max(0, rawDistance - Math.min(accuracy / 2, 35));

    if (effectiveDistance > maxRadius) {
      setIsProcessing(false);
      setLoadingStepText('');
      setStatusMessage({
        text: `عفواً، لا يمكنك تسجيل البصمة! أنت خارج نطاق فرع (${currentBranch.nameAr || currentBranch.name}). المسافة: ${rawDistance} متر (الحد المسموح: ${maxRadius} متر).`,
        isError: true,
      });
      return;
    }

    const payload = {
      userId: userId || '1',
      userName: userName || 'موظف',
      branchId: currentBranch.id,
      branchName: currentBranch.nameAr || currentBranch.name || '',
      type,
      latitude: userLat,
      longitude: userLng,
      distanceMeters: rawDistance,
      isVerifiedGeofence: true,
      recordedAt: new Date().toISOString(),
    };

    // 1. إذا كان الهاتف غير متصل بالإنترنت (Offline Mode)
    if (!navigator.onLine) {
      try {
        const q = JSON.parse(localStorage.getItem('offlineAttendanceQueue') || '[]');
        q.push(payload);
        localStorage.setItem('offlineAttendanceQueue', JSON.stringify(q));
        refreshOfflineCount();
        setIsProcessing(false);
        setLoadingStepText('');
        setStatusMessage({
          text: `⚠️ الهاتف غير متصل بالإنترنت: تم حفظ حركة ${type === 'CHECK_IN' ? 'حضورك' : 'انصرافك'} محلياً بأمان! سيتم رفعها للسيرفر تلقائياً فور عودة الشبكة.`,
          isError: false,
        });
        return;
      } catch (err) {
        setIsProcessing(false);
        setLoadingStepText('');
        setStatusMessage({ text: 'فشل الحفظ في الذاكرة المحلية', isError: true });
        return;
      }
    }

    // 2. إذا كان متصلاً بالإنترنت (Online Mode)
    try {
      const saveRes = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!saveRes.ok) throw new Error('فشل حفظ البصمة في السيرفر');

      setStatusMessage({
        text: `تم تسجيل ${type === 'CHECK_IN' ? 'الحضور' : 'الانصراف'} بنجاح تام! موقعك مطابق للفرع بنسبة 100% (المسافة: ${rawDistance} متر).`,
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
      {/* شريط حالة الشبكة والأوفلاين */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[#121526]/80 text-xs">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="font-bold">
            {isOnline ? 'الاتصال بالإنترنت نشط (Online)' : 'الهاتف غير متصل بالشبكة (Offline Mode)'}
          </span>
        </div>

        {offlineQueueCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 font-bold text-amber-600">
              يوجد ({offlineQueueCount}) بصمات محفوظة أوفلاين بانتظار المزامنة
            </span>
            {isOnline && (
              <button
                type="button"
                onClick={syncOfflineQueue}
                className="rounded-lg bg-orange-600 px-2.5 py-1 font-bold text-white hover:bg-orange-700 cursor-pointer"
              >
                مزامنة الآن ⟳
              </button>
            )}
          </div>
        )}
      </div>

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

        {/* كارت الفرع المعتمد */}
        <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                {isAdmin ? 'اختر الفرع لتسجيل الحضور / الاختبار:' : 'الفرع المسند إليك رسمياً:'}
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
                  {currentBranch ? (currentBranch.nameAr || currentBranch.name) : 'جاري التحميل...'}
                </h3>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {currentBranch?.address || 'العنوان مسجل بالنظام'}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/50 dark:bg-black/30 p-3 font-mono text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <div><strong>إحداثيات الفرع المسجلة:</strong></div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                Lat: {currentBranch?.latitude || '—'} | Lng: {currentBranch?.longitude || '—'}
              </div>
              <div className="text-[11px]">
                نطاق السماح: <strong className="text-orange-600 font-bold">{currentBranch?.radiusMeters || currentBranch?.geofenceRadius || 100} متر</strong>
              </div>
            </div>
          </div>

          {currentCoords && (
            <div className="mt-4 pt-3 border-t border-orange-500/10 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-300">
                  موقعك الفعلي: <strong>{currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}</strong>
                  {gpsAccuracy !== null && (
                    <span className="mr-2 inline-flex rounded bg-slate-200 dark:bg-white/10 px-2 py-0.5 text-[10px] text-slate-700 dark:text-slate-300">
                      دقة الإشارة: ±{gpsAccuracy}م
                    </span>
                  )}
                </span>

                {currentDistance !== null && (
                  <span className="font-bold">
                    المسافة عن الفرع:{' '}
                    <span className={currentDistance <= (currentBranch?.radiusMeters || 100) ? 'text-emerald-500 text-sm font-black' : 'text-rose-500 text-sm font-black'}>
                      {currentDistance} متر {currentDistance <= (currentBranch?.radiusMeters || 100) ? '✓ (داخل النطاق)' : '✗ (خارج النطاق)'}
                    </span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {loadingStepText && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 text-xs font-bold text-orange-600 dark:text-orange-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            <span>{loadingStepText}</span>
          </div>
        )}

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

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            disabled={isProcessing || isLoading || !currentBranch}
            onClick={() => handleRecordAttendance('CHECK_IN')}
            className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
          >
            <span className="text-3xl">📍</span>
            <span className="mt-2 text-lg font-black">تسجيل حضور</span>
            <span className="text-[11px] opacity-80">{isOnline ? 'تأكيد التواجد داخل الفرع' : 'حفظ الحركة في وضع الأوفلاين'}</span>
          </button>

          <button
            type="button"
            disabled={isProcessing || isLoading || !currentBranch}
            onClick={() => handleRecordAttendance('CHECK_OUT')}
            className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 p-6 text-white shadow-lg transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
          >
            <span className="text-3xl">🚪</span>
            <span className="mt-2 text-lg font-black">تسجيل انصراف</span>
            <span className="text-[11px] opacity-80">{isOnline ? 'اعتماد نهاية ساعات العمل' : 'حفظ الحركة في وضع الأوفلاين'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
