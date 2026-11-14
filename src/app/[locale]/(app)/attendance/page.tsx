'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
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
  Building2,
} from 'lucide-react';
import {
  saveOfflineAttendance,
  getPendingOfflineAttendance,
  syncOfflineAttendance,
} from '@/offlineSync';

interface BranchItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
}

type CameraPermission = 'checking' | 'prompt' | 'granted' | 'denied';

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

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const manualBranchSelectedRef = useRef<boolean>(false);

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isInsideGeofence, setIsInsideGeofence] = useState<boolean>(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraRequestRef = useRef(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<CameraPermission>('checking');
  const [lastCapturedPhoto, setLastCapturedPhoto] = useState<string>('');

  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // Load branches once without resetting user selection
  useEffect(() => {
    let mounted = true;
    const loadBranches = async () => {
      try {
        const cachedRaw = localStorage.getItem('lk_cached_branches');
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (mounted && Array.isArray(parsed) && parsed.length > 0) {
            setBranches(parsed);
            const userSavedBranch = localStorage.getItem('userBranchId') || '';
            const initial = parsed.find((b: BranchItem) => b.id === userSavedBranch) || parsed[0];
            if (initial) setSelectedBranchId(initial.id);
          }
        }
      } catch {}
      try {
        const res = await fetch('/api/branches', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && Array.isArray(data) && data.length > 0) {
          const mapped: BranchItem[] = data.map((b: Record<string, unknown>) => ({
            id: String(b.id ?? ''),
            name: String(b.nameAr || b.name_ar || b.name || 'فرع'),
            lat: parseFloat(String(b.latitude ?? 31.12225)),
            lng: parseFloat(String(b.longitude ?? 30.64821)),
            radius: Math.max(1, Number(b.geofenceRadius ?? b.geofence_radius ?? b.radiusMeters ?? 10)),
          }));
          setBranches(mapped);
          try { localStorage.setItem('lk_cached_branches', JSON.stringify(mapped)); } catch {}
          const userSavedBranch = localStorage.getItem('userBranchId') || '';
          const initialBranch = mapped.find((b) => b.id === userSavedBranch) || mapped[0];
          if (initialBranch) {
            setSelectedBranchId(initialBranch.id);
          }
        }
      } catch {}
    };
    loadBranches();
    return () => {
      mounted = false;
    };
  }, []);

  const currentBranch = branches.find((b) => b.id === selectedBranchId) || branches[0] || {
    id: '1',
    name: 'الفرع الرئيسي',
    lat: 31.12225,
    lng: 30.64821,
    radius: 10,
  };

  // Recalculate distance cleanly whenever userCoords or selectedBranchId changes (NO auto-branch switching loop)
  useEffect(() => {
    if (!userCoords || branches.length === 0) return;

    // Only auto-pick closest branch on very first GPS read if user hasn't manually changed the dropdown
    if (!manualBranchSelectedRef.current && branches.length > 1) {
      let closest = currentBranch;
      let minDist = getDistanceMeters(userCoords.lat, userCoords.lng, currentBranch.lat, currentBranch.lng);
      for (const b of branches) {
        const d = getDistanceMeters(userCoords.lat, userCoords.lng, b.lat, b.lng);
        if (d < minDist) {
          minDist = d;
          closest = b;
        }
      }
      manualBranchSelectedRef.current = true;
      if (closest.id !== selectedBranchId) {
        setSelectedBranchId(closest.id);
        return;
      }
    }

    const dist = getDistanceMeters(userCoords.lat, userCoords.lng, currentBranch.lat, currentBranch.lng);
    setDistance(dist);
    // Strict exact radius check without any +100m buffer
    setIsInsideGeofence(dist <= currentBranch.radius);
  }, [userCoords, selectedBranchId, branches, currentBranch]);

  const acquirePreciseLocation = useCallback(() => {
    setLocating(true);

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
        maximumAge: 5000,
      }
    );
  }, []);

  const checkPending = useCallback(async () => {
    try {
      const pending = await getPendingOfflineAttendance();
      setPendingCount(pending.length);
    } catch {}
  }, []);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const uid = (localStorage.getItem('userId') || '').trim();
    const uname = localStorage.getItem('userName') || '';
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuth || !uid) {
      window.location.replace('/' + locale + '/login');
      return;
    }
    setUserId(uid);
    setUserName(uname);

    checkPending();
    if (navigator.onLine) {
      void syncOfflineAttendance().then((res) => {
        checkPending();
        if (res.syncedCount > 0) {
          setStatusMsg({
            type: 'ok',
            text: `✅ تمت مزامنة (${res.syncedCount}) بصمة أوفلاين ورفعها للسيرفر بنجاح!`,
          });
        }
      });
    }
    acquirePreciseLocation();

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
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, [acquirePreciseLocation, checkPending]);

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  // Wide-angle natural camera (no zoomed-in portrait crop)
  const startCamera = useCallback(async () => {
    if (cameraRequestRef.current || cameraStreamRef.current) return;
    cameraRequestRef.current = true;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('الكاميرا تتطلب اتصالاً آمناً بالإنترنت (HTTPS).');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      // Attempt to set zoom to minimum (1x wide angle) if supported by the mobile lens
      const [videoTrack] = stream.getVideoTracks();
      if (videoTrack && 'getCapabilities' in videoTrack) {
        try {
          const caps = (videoTrack as unknown as { getCapabilities: () => Record<string, { min?: number }> }).getCapabilities();
          if (caps?.zoom?.min) {
            await videoTrack.applyConstraints({ advanced: [{ zoom: caps.zoom.min } as MediaTrackConstraintSet] });
          }
        } catch {}
      }

      cameraStreamRef.current = stream;
      setCameraPermission('granted');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (error) {
      stopCamera();
      const errorName = error instanceof Error ? error.name : '';
      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        setCameraPermission('denied');
      }
    } finally {
      cameraRequestRef.current = false;
    }
  }, [stopCamera]);

  useEffect(() => {
    const uid = (localStorage.getItem('userId') || '').trim();
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';
    if (!isAuth || !uid) return;
    void startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Instant frame capture directly from live video stream during Check-In / Check-Out click
  const captureLiveFrameBase64 = (): string => {
    if (!videoRef.current || !cameraActive) return lastCapturedPhoto || '';
    const video = videoRef.current;
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    const canvas = document.createElement('canvas');
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.drawImage(video, 0, 0, vw, vh);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
    setLastCapturedPhoto(dataUrl);
    return dataUrl;
  };

  const handleAttendanceAction = async (action: 'CHECK_IN' | 'CHECK_OUT') => {
    setStatusMsg(null);

    if (!userCoords || distance === null) {
      setStatusMsg({
        type: 'err',
        text: '❌ لم يتم تسجيل حضورك: يرجى الانتظار حتى يتم تحديد موقعك الجغرافي أولاً.',
      });
      return;
    }

    if (!isInsideGeofence || distance > currentBranch.radius) {
      setStatusMsg({
        type: 'err',
        text: `❌ لم يتم تسجيل حضورك: أنت خارج نطاق (${currentBranch.name}) بمسافة ${distance} متر (المسموح ${currentBranch.radius} متر فقط).`,
      });
      return;
    }

    if (!cameraActive && !lastCapturedPhoto) {
      await startCamera();
    }

    const photo = captureLiveFrameBase64();
    if (!photo) {
      setStatusMsg({
        type: 'err',
        text: '❌ لم يتم تسجيل حضورك: يرجى السماح بفتح الكاميرا لالتقاط صورة البصمة تلقائياً.',
      });
      return;
    }

    setLoading(true);

    if (!navigator.onLine) {
      try {
        await saveOfflineAttendance({
          userId,
          userName,
          branchId: currentBranch.id,
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
          text: `✅ تم تسجيل ${action === 'CHECK_IN' ? 'حضورك' : 'انصرافك'} أوفلاين في (${currentBranch.name}) — المسافة ${distance}م. سيتم رفعها تلقائياً فور اتصال الهاتف بالإنترنت.`,
        });
      } catch {
        setStatusMsg({
          type: 'err',
          text: '❌ تعذر حفظ البصمة محلياً على الهاتف.',
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          branchId: currentBranch.id,
          latitude: userCoords.lat,
          longitude: userCoords.lng,
          distanceMeters: distance,
          photoBase64: photo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'فشل تسجيل الحركة');
      }

      setStatusMsg({
        type: 'ok',
        text: action === 'CHECK_IN'
          ? `✅ تم تسجيل حضورك بنجاح في (${currentBranch.name}) — المسافة ${distance}م وتم حفظ صورتك.`
          : `✅ تم تسجيل انصرافك بنجاح من (${currentBranch.name}) — المسافة ${distance}م وتم حفظ صورتك.`,
      });
    } catch (err: unknown) {
      if (!navigator.onLine) {
        await saveOfflineAttendance({
          userId,
          userName,
          branchId: currentBranch.id,
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
          text: `✅ تم تسجيل ${action === 'CHECK_IN' ? 'حضورك' : 'انصرافك'} أوفلاين وسيتم رفعه فور عودة الإنترنت.`,
        });
      } else {
        const msg = err instanceof Error ? err.message : 'تعذر تسجيل البصمة';
        setStatusMsg({
          type: 'err',
          text: `❌ لم يتم تسجيل ${action === 'CHECK_IN' ? 'حضورك' : 'انصرافك'}: ${msg}`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-14" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* شريط الاتصال وتحديث الـ GPS */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <Wifi size={13} /> متصل بالإنترنت
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold">
              <WifiOff size={13} /> وضع الأوفلاين
            </span>
          )}
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sky-500/15 border border-sky-500/30 text-sky-500 text-xs font-bold">
              <CloudUpload size={13} /> {pendingCount} معلقة
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={acquirePreciseLocation}
          className="inline-flex items-center gap-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#232a32] px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
        >
          <RefreshCw size={13} className={locating ? 'animate-spin text-[#57cef8]' : ''} />
          <span>تحديث الموقع</span>
        </button>
      </div>

      {/* رسالة التأكيد الخضراء أو الحمراء الواضحة */}
      {statusMsg && (
        <div
          className={`p-4 rounded border-2 flex items-center gap-3 text-sm font-extrabold shadow-md ${
            statusMsg.type === 'ok'
              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300'
          }`}
        >
          {statusMsg.type === 'ok' ? <CheckCircle2 size={22} className="shrink-0 text-emerald-500" /> : <AlertCircle size={22} className="shrink-0 text-rose-500" />}
          <span className="leading-relaxed">{statusMsg.text}</span>
        </div>
      )}

      {/* اختيار الفرع وفحص النطاق */}
      <div className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#232a32] p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
            <Building2 size={16} className="text-[#57cef8]" />
            <span>فرع العمل الحالي:</span>
          </div>
          <select
            value={selectedBranchId}
            onChange={(e) => {
              manualBranchSelectedRef.current = true;
              setSelectedBranchId(e.target.value);
              setStatusMsg(null);
            }}
            className="rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-[#181d23] text-slate-900 dark:text-white px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-[#57cef8]"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} (النطاق: {b.radius}م)
              </option>
            ))}
          </select>
        </div>

        <div
          className={`p-3.5 rounded border transition-all ${
            locating
              ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700'
              : isInsideGeofence
              ? 'bg-emerald-500/10 border-emerald-500/40'
              : 'bg-rose-500/10 border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {locating ? (
                <Loader2 size={20} className="animate-spin text-[#57cef8] shrink-0" />
              ) : isInsideGeofence ? (
                <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
              ) : (
                <ShieldAlert size={20} className="text-rose-500 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {currentBranch.name} — نطاق السماح المعتمد: ({currentBranch.radius} م)
                </div>
                <div className="text-xs mt-0.5">
                  {locating ? (
                    <span className="text-slate-500 dark:text-slate-400">جاري تحديد المسافة عبر الـ GPS...</span>
                  ) : isInsideGeofence ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      ✅ أنت داخل النطاق (المسافة: {distance}م). اضغط تسجيل الحضور لالتقاط الصورة والبصمة معاً.
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 font-bold">
                      ❌ خارج النطاق بـ {Math.max(1, (distance || 0) - currentBranch.radius)} متر! (مسافتك: {distance}م والحد المسموح: {currentBranch.radius}م).
                    </span>
                  )}
                </div>
              </div>
            </div>
            {locationAccuracy !== null && (
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                دقة ±{locationAccuracy}م
              </span>
            )}
          </div>
        </div>
      </div>

      {/* الكاميرا الحية بزاوية واسعة طبيعية بدون زووم وبدون زر منفصل */}
      <div className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#232a32] p-4 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
            <Camera size={15} className="text-[#57cef8]" />
            <span>الكاميرا المباشرة (تُلتقط الصورة تلقائياً لحظة ضغط زر البصمة)</span>
          </h3>
        </div>

        <div className="relative aspect-[4/3] w-full max-w-md mx-auto rounded overflow-hidden bg-slate-950 border border-slate-300 dark:border-slate-700 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-contain transform -scale-x-100 ${cameraActive ? 'block' : 'hidden'}`}
          />

          {!cameraActive && (
            <div className="flex flex-col items-center justify-center gap-2 p-4 text-center text-white">
              <p className="text-xs">
                {cameraPermission === 'denied'
                  ? 'تم رفض صلاحية الكاميرا. يرجى تفعيلها من إعدادات المتصفح.'
                  : 'اضغط لتشغيل الكاميرا المباشرة'}
              </p>
              <button
                type="button"
                onClick={() => void startCamera()}
                className="rounded bg-[#57cef8] px-4 py-1.5 text-xs font-bold text-[#181d23]"
              >
                تشغيل الكاميرا
              </button>
            </div>
          )}
        </div>
      </div>

      {/* أزرار الحضور والانصراف — تلتقط الصورة والبصمة في ضغطة واحدة وتُقفل خارج النطاق */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={loading || locating || !isInsideGeofence}
          onClick={() => handleAttendanceAction('CHECK_IN')}
          className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded text-xs font-extrabold transition-all ${
            !isInsideGeofence || locating
              ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md'
          }`}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          <span>تسجيل الحضور (بصمة + صورة)</span>
        </button>

        <button
          type="button"
          disabled={loading || locating || !isInsideGeofence}
          onClick={() => handleAttendanceAction('CHECK_OUT')}
          className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded text-xs font-extrabold transition-all ${
            !isInsideGeofence || locating
              ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              : 'bg-[#57cef8] hover:bg-[#3a4149] text-[#181d23] hover:text-white cursor-pointer shadow-md'
          }`}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
          <span>تسجيل الانصراف (بصمة + صورة)</span>
        </button>
      </div>
    </div>
  );
}
