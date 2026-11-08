'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  MapPin,
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Loader2,
  ShieldAlert,
  WifiOff,
  Wifi,
  CloudUpload,
} from 'lucide-react';
import {
  saveOfflineAttendance,
  getPendingOfflineAttendance,
  syncOfflineAttendance,
} from '@/utils/offlineSync';

export default function AttendancePage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isRtl = locale === 'ar';

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  // بيانات الموقع والفرع
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [branchInfo, setBranchInfo] = useState<{
    name: string;
    lat: number;
    lng: number;
    radius: number;
  }>({
    name: 'الفرع الرئيسي',
    lat: 31.1308,
    lng: 30.6475,
    radius: 60,
  });

  const [distance, setDistance] = useState<number | null>(null);
  const [isInsideGeofence, setIsInsideGeofence] = useState<boolean>(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);

  // الكاميرا والسيلفي
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [selfiePhoto, setSelfiePhoto] = useState<string>('');

  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // حساب المسافة الدقيقة (Haversine Formula) - تعمل بدون نت
  const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // استرجاع بيانات الفرع (مع حفظها محلياً للعمل أوفلاين)
  const fetchEmployeeBranch = async (uid: string) => {
    // محاولة القراءة من الكاش المحلي أولاً إذا كان أوفلاين
    try {
      const cachedBranch = localStorage.getItem(`user_branch_${uid}`);
      if (cachedBranch) {
        setBranchInfo(JSON.parse(cachedBranch));
      }
    } catch {}

    if (!navigator.onLine) return;

    try {
      const res = await fetch(`/api/employees?id=${uid}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const emp = Array.isArray(data) ? data.find((e: any) => String(e.id) === uid) : data;
        if (emp && emp.branchLat && emp.branchLng) {
          const info = {
            name: emp.branchName || 'فرع العمل',
            lat: parseFloat(emp.branchLat),
            lng: parseFloat(emp.branchLng),
            radius: Number(emp.branchRadius) || 60,
          };
          setBranchInfo(info);
          localStorage.setItem(`user_branch_${uid}`, JSON.stringify(info));
        }
      }
    } catch (e) {
      console.error('Error fetching branch coordinates:', e);
    }
  };

  // فحص عدد البصمات المعلقة أوفلاين
  const checkPending = async () => {
    try {
      const pending = await getPendingOfflineAttendance();
      setPendingCount(pending.length);
    } catch {}
  };

  // التقاط GPS حقيقي بدقة عالية حتى في حالة الأوفلاين
  const acquirePreciseLocation = () => {
    setLocating(true);
    setStatusMsg(null);

    if (!navigator.geolocation) {
      setStatusMsg({ type: 'err', text: 'خاصية تحديد الموقع الجغرافي غير مدعومة في جهازك' });
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = Math.round(position.coords.accuracy);

        setUserCoords({ lat, lng });
        setLocationAccuracy(acc);

        const dist = getDistanceMeters(lat, lng, branchInfo.lat, branchInfo.lng);
        setDistance(dist);
        setIsInsideGeofence(dist <= branchInfo.radius);
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        let errorText = 'تعذر تحديد موقعك. يرجى تفعيل الـ GPS والسماح بالوصول للموقع.';
        if (error.code === error.PERMISSION_DENIED) {
          errorText = 'تم رفض إذن الوصول للموقع. يرجى تفعيل الإذن من إعدادات المتصفح.';
        }
        setStatusMsg({ type: 'err', text: errorText });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleStatusChange = async () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        const res = await syncOfflineAttendance();
        if (res.syncedCount > 0) {
          setStatusMsg({
            type: 'ok',
            text: `تم الاتصال بالإنترنت ومزامنة (${res.syncedCount}) بصمة معلقة بنجاح!`,
          });
        }
        checkPending();
      }
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    const uid = localStorage.getItem('userId') || '';
    const uname = localStorage.getItem('userName') || '';
    setUserId(uid);
    setUserName(uname);

    if (uid) {
      fetchEmployeeBranch(uid);
    }
    checkPending();
    acquirePreciseLocation();
    startCamera();

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (userCoords && branchInfo.lat && branchInfo.lng) {
      const dist = getDistanceMeters(userCoords.lat, userCoords.lng, branchInfo.lat, branchInfo.lng);
      setDistance(dist);
      setIsInsideGeofence(dist <= branchInfo.radius);
    }
  }, [branchInfo, userCoords]);

  // تشغيل الكاميرا
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 320 }, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch {
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  // التقاط وضغط السيلفي
  const capturePhoto = () => {
    if (!videoRef.current) return '';
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 240, 240);
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      setSelfiePhoto(base64);
      return base64;
    }
    return '';
  };

  // تسجيل البصمة (أونلاين أو أوفلاين)
  const handleAttendanceAction = async (action: 'CHECK_IN' | 'CHECK_OUT') => {
    setStatusMsg(null);

    if (!userCoords) {
      setStatusMsg({ type: 'err', text: 'يرجى الانتظار حتى يتم تحديد موقعك الجغرافي بدقة أولاً' });
      return;
    }

    if (!isInsideGeofence) {
      setStatusMsg({
        type: 'err',
        text: `لا يمكنك تسجيل البصمة! أنت تبعد ${distance} متر عن الفرع (المسموح: ${branchInfo.radius} متر).`,
      });
      return;
    }

    let photo = selfiePhoto;
    if (!photo) {
      photo = capturePhoto();
    }

    setLoading(true);

    // حالة 1: الجهاز غير متصل بالإنترنت (أوفلاين)
    if (!navigator.onLine) {
      try {
        await saveOfflineAttendance({
          userId,
          userName,
          action,
          latitude: userCoords.lat,
          longitude: userCoords.lng,
          distanceMeters: distance || 0,
          photoBase64: photo,
          timestamp: new Date().toISOString(),
        });

        await checkPending();
        setLoading(false);
        setStatusMsg({
          type: 'ok',
          text: `تم تسجيل ${
            action === 'CHECK_IN' ? 'حضورك' : 'انصرافك'
          } محلياً (أوفلاين)! سيتم رفع البيانات تلقائياً أول ما يلقط إنترنت.`,
        });
        return;
      } catch (err: any) {
        setLoading(false);
        setStatusMsg({ type: 'err', text: 'حدث خطأ أثناء حفظ البصمة محلياً.' });
        return;
      }
    }

    // حالة 2: الجهاز متصل بالإنترنت (أونلاين)
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userId,
          latitude: userCoords.lat,
          longitude: userCoords.lng,
          distanceMeters: distance,
          photoBase64: photo,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل تسجيل الحركة');

      setStatusMsg({
        type: 'ok',
        text: data.message || `تم تسجيل ${action === 'CHECK_IN' ? 'حضورك' : 'انصرافك'} بنجاح!`,
      });
    } catch (err: any) {
      // إذا حدث انقطاع مفاجئ بالنت أثناء الإرسال، حفظها أوفلاين
      await saveOfflineAttendance({
        userId,
        userName,
        action,
        latitude: userCoords.lat,
        longitude: userCoords.lng,
        distanceMeters: distance || 0,
        photoBase64: photo,
        timestamp: new Date().toISOString(),
      });
      await checkPending();
      setStatusMsg({
        type: 'ok',
        text: 'انقطع الاتصال، وتم حفظ البصمة بنجاح أوفلاين وسيتم رفعها تلقائياً فور عودة النت.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16 text-white" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* شريط حالة الاتصال والأوفلاين */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <Wifi size={13} /> متصل بالإنترنت
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold animate-pulse">
              <WifiOff size={13} /> وضع الأوفلاين (شغال بدون نت)
            </span>
          )}

          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-black">
              <CloudUpload size={13} /> {pendingCount} معلقة
            </span>
          )}
        </div>

        {pendingCount > 0 && isOnline && (
          <button
            type="button"
            onClick={async () => {
              const res = await syncOfflineAttendance();
              if (res.syncedCount > 0) {
                setStatusMsg({ type: 'ok', text: `تم رفع ${res.syncedCount} بصمة معلقة بنجاح!` });
              }
              checkPending();
            }}
            className="text-xs text-orange-400 hover:underline font-bold cursor-pointer"
          >
            مزامنة الآن
          </button>
        )}
      </div>

      {/* الترويسة الرئيسية */}
      <div className="bg-[#0c0e18] border border-white/5 p-6 sm:p-8 rounded-3xl shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Clock size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">تسجيل الحضور والانصراف الميداني</h1>
            <p className="text-xs text-slate-400 mt-1">
              يدعم التسجيل الأوفلاين والرفع التلقائي عند استعادة الاتصال
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={acquirePreciseLocation}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          title="تحديث إحداثيات الـ GPS"
        >
          <RefreshCw size={13} className={locating ? 'animate-spin text-orange-500' : ''} />
          <span className="hidden sm:inline">تحديث الموقع</span>
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 border text-xs font-bold ${
            statusMsg.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {statusMsg.type === 'ok' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="leading-relaxed">{statusMsg.text}</span>
        </div>
      )}

      {/* بطاقة فحص نطاق الـ Geofence */}
      <div
        className={`p-6 rounded-3xl border shadow-xl transition-all ${
          locating
            ? 'bg-slate-900/60 border-slate-800'
            : isInsideGeofence
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-rose-500/10 border-rose-500/30'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                locating
                  ? 'bg-slate-800 text-slate-400'
                  : isInsideGeofence
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {locating ? (
                <Loader2 size={20} className="animate-spin" />
              ) : isInsideGeofence ? (
                <CheckCircle2 size={22} />
              ) : (
                <ShieldAlert size={22} />
              )}
            </div>

            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{branchInfo.name}</span>
                <span className="text-[11px] font-mono font-normal text-slate-400">
                  (نطاق الـ Geofence: {branchInfo.radius} متر)
                </span>
              </h2>

              <p className="text-xs mt-1">
                {locating ? (
                  <span className="text-slate-400">جاري قراءة الـ GPS من أقمار الموقع...</span>
                ) : isInsideGeofence ? (
                  <span className="text-emerald-400 font-bold">
                    أنت داخل نطاق الفرع (المسافة: {distance} متر). جاهز لتسجيل البصمة.
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold">
                    أنت خارج نطاق الفرع! المسافة الحالية: {distance} متر (الحد الأقصى المسموح: {branchInfo.radius}م).
                  </span>
                )}
              </p>
            </div>
          </div>

          {locationAccuracy !== null && (
            <div className="text-left font-mono text-[11px] text-slate-400 shrink-0 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
              <span>دقة الـ GPS: ±{locationAccuracy}م</span>
            </div>
          )}
        </div>
      </div>

      {/* الكاميرا الحية والتقاط سيلفي الحضور */}
      <div className="bg-[#0c0e18] border border-white/5 p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <Camera size={16} className="text-orange-500" />
            <span>التوثيق البصري (سيلفي حي يعمل أوفلاين)</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-semibold">مطلوبة مع كل بصمة</span>
        </div>

        <div className="relative aspect-video max-w-sm mx-auto rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
          {selfiePhoto ? (
            <img src={selfiePhoto} alt="Captured Selfie" className="w-full h-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          )}

          {selfiePhoto && (
            <button
              type="button"
              onClick={() => setSelfiePhoto('')}
              className="absolute bottom-3 right-3 bg-black/70 hover:bg-black text-white px-3 py-1.5 rounded-xl text-[11px] font-bold backdrop-blur-xs cursor-pointer"
            >
              إعادة الالتقاط
            </button>
          )}
        </div>
      </div>

      {/* أزرار الحضور والانصراف */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <button
          type="button"
          disabled={loading || locating || !isInsideGeofence}
          onClick={() => handleAttendanceAction('CHECK_IN')}
          className={`flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-xs font-bold transition-all shadow-xl cursor-pointer ${
            !isInsideGeofence || locating
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20 hover:scale-[1.01]'
          }`}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          <span>تسجيل الحضور {!isOnline && '(أوفلاين)'}</span>
        </button>

        <button
          type="button"
          disabled={loading || locating || !isInsideGeofence}
          onClick={() => handleAttendanceAction('CHECK_OUT')}
          className={`flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-xs font-bold transition-all shadow-xl cursor-pointer ${
            !isInsideGeofence || locating
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white shadow-orange-500/20 hover:scale-[1.01]'
          }`}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
          <span>تسجيل الانصراف {!isOnline && '(أوفلاين)'}</span>
        </button>
      </div>

      {!isInsideGeofence && !locating && (
        <p className="text-center text-xs text-rose-400 font-semibold leading-relaxed">
          ⚠️ الأزرار معطلة تلقائياً لأنك خارج النطاق الجغرافي للفرع. يجب التواجد داخل مقر العمل لتسجيل البصمة.
        </p>
      )}
    </div>
  );
}
