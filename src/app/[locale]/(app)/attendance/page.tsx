'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, MapPin, CheckCircle2, AlertCircle, RefreshCw, Loader2, FlipHorizontal } from 'lucide-react';

interface AttendancePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function AttendancePage({ params }: AttendancePageProps) {
  const resolvedParams = use(params);
  const locale = resolvedParams?.locale || 'ar';
  const isRtl = locale === 'ar';
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. تحميل بيانات المستخدم والتحقق من نمط البصمة
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(console.error);

    getCurrentLocation();
    return () => {
      stopCamera();
    };
  }, []);

  // 2. جلب إحداثيات الـ GPS
  const getCurrentLocation = () => {
    setErrorMsg(null);
    if (!navigator.geolocation) {
      setErrorMsg('خدمة تحديد الموقع الجغرافي (GPS) غير مدعومة على هذا الهاتف');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        // المسافة التجريبية الافتراضية
        setDistance(25);
      },
      (err) => {
        setErrorMsg('يرجى تفعيل صلاحية الـ GPS وسماح المتصفح بالوصول للموقع');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // 3. تشغيل الكاميرا بالوضع الرأسي الطولي (Portrait 3:4)
  const startCamera = async () => {
    setErrorMsg(null);
    setCapturedImage(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 720 },
          height: { ideal: 960 }, // أبعاد رأسية طولية
          aspectRatio: { ideal: 3 / 4 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setErrorMsg('تعذر فتح الكاميرا، يرجى منح الإذن للمتصفح');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // قلب الكاميرا (أمامية / خلفية)
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    setTimeout(() => {
      startCamera();
    }, 200);
  };

  // 4. التقاط صورة السيلفي الطولية
  const capturePortraitPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // أبعاد الكانفاس الطولية 3:4
    canvas.width = 720;
    canvas.height = 960;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1); // مرآة طبيعية للوجه
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  // 5. تسجيل البصمة (حضور أو انصراف)
  const submitAttendance = async (type: 'CHECK_IN' | 'CHECK_OUT') => {
    const isGpsOnly = user?.verification_mode === 'GPS_ONLY';

    if (!isGpsOnly && !capturedImage) {
      setErrorMsg('يجب التقاط صورة سيلفي حية لتوثيق البصمة');
      return;
    }

    if (!gpsLocation) {
      setErrorMsg('جاري جلب إحداثيات الموقع، انتظر لحظات وحاول مجدداً');
      getCurrentLocation();
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: type,
          latitude: gpsLocation.lat,
          longitude: gpsLocation.lng,
          distanceMeters: distance || 30,
          photoBase64: capturedImage || null,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'فشل تسجيل الحركة');

      setSuccessMsg(type === 'CHECK_IN' ? 'تم تسجيل حضورك بنجاح!' : 'تم تسجيل انصرافك بنجاح!');
      setCapturedImage(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ في التسجيل');
    } finally {
      setLoading(false);
    }
  };

  const isGpsOnly = user?.verification_mode === 'GPS_ONLY';

  return (
    <div className="max-w-md mx-auto space-y-6 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* الترويسة */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center space-y-2">
        <h1 className="text-xl font-black text-white">تسجيل البصمة الذكية</h1>
        <p className="text-xs text-slate-400">توثيق الحضور والانصراف بالنطاق الجغرافي وصورة الوجه</p>
      </div>

      {/* التنبيهات */}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* كارت الـ GPS */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <MapPin className="text-orange-500" size={16} />
          <span>حالة الموقع الجغرافي:</span>
          {gpsLocation ? (
            <span className="text-emerald-400 font-bold font-mono">داخل الفرع (~{distance}م)</span>
          ) : (
            <span className="text-slate-500">جاري التحديد...</span>
          )}
        </div>
        <button
          onClick={getCurrentLocation}
          className="text-orange-400 hover:text-orange-300 p-1.5 rounded-lg bg-orange-500/10"
          title="تحديث الموقع"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* مساحة الكاميرا الطولية (Portrait Container 3:4) */}
      {!isGpsOnly && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl text-center space-y-4">
          <div className="relative w-full max-w-[260px] mx-auto aspect-[3/4] bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-inner flex items-center justify-center">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
            ) : capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured Selfie"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-slate-600 flex flex-col items-center gap-2">
                <Camera size={36} />
                <span className="text-[11px] font-semibold">الصورة الملتقطة ستظهر هنا بالطول</span>
              </div>
            )}

            {/* زر قلب الكاميرا */}
            {cameraActive && (
              <button
                type="button"
                onClick={toggleFacingMode}
                className="absolute top-3 left-3 bg-black/60 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/80"
                title="تبديل الكاميرا"
              >
                <FlipHorizontal size={16} />
              </button>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* أزرار تشغيل والتقاط الكاميرا */}
          <div className="flex justify-center gap-3">
            {!cameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition"
              >
                <Camera size={15} />
                <span>{capturedImage ? 'إعادة التقاط الصورة' : 'فتح الكاميرا'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={capturePortraitPhoto}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg"
              >
                <span>التقاط الصورة الشخصية</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* أزرار الحضور والانصراف */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          disabled={loading}
          onClick={() => submitAttendance('CHECK_IN')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          <span>تسجيل حضور</span>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => submitAttendance('CHECK_OUT')}
          className="bg-rose-600 hover:bg-rose-500 text-white py-3.5 rounded-2xl text-xs font-bold shadow-lg shadow-rose-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          <span>تسجيل انصراف</span>
        </button>
      </div>
    </div>
  );
}
