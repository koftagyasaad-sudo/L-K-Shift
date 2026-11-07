'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Camera, MapPin, CheckCircle2, AlertCircle, RefreshCw, 
  Loader2, FlipHorizontal, X, ShieldCheck, UserCheck 
} from 'lucide-react';

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

  // حالة النافذة المنبثقة للكاميرا
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'CHECK_IN' | 'CHECK_OUT' | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. تحميل بيانات المستخدم والتحقق من الموقع
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(console.error);

    getCurrentLocation();

    return () => {
      stopCamera();
    };
  }, []);

  // 2. فحص الـ GPS
  const getCurrentLocation = () => {
    setErrorMsg(null);
    if (!navigator.geolocation) {
      setErrorMsg('خدمة الموقع الجغرافي (GPS) غير مدعومة على هذا الجهاز');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setDistance(25); // مسافة تقريبية داخل الفرع
      },
      () => {
        setErrorMsg('يرجى تفعيل الـ GPS وإعطاء الإذن للمتصفح لتحديد موقع الفرع');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // 3. التحكم بالكاميرا
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 720 },
          height: { ideal: 960 }, // أبعاد رأسية طولية 3:4
          aspectRatio: { ideal: 3 / 4 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setErrorMsg('تعذر فتح الكاميرا، يرجى التأكد من صلاحية الكاميرا بالمتصفح');
      setIsCameraModalOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // 4. معالجة الضغط على زر الحضور أو الانصراف
  const handleInitiateAction = (action: 'CHECK_IN' | 'CHECK_OUT') => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!gpsLocation) {
      setErrorMsg('جاري جلب إحداثيات موقعك، يرجى الانتظار ثوانٍ والمحاولة ثانية');
      getCurrentLocation();
      return;
    }

    const isGpsOnly = user?.verification_mode === 'GPS_ONLY';

    if (isGpsOnly) {
      // إذا كان الموظف محدد له الموقع فقط، سجل البصمة فوراً بدون كاميرا
      submitAttendance(action, null);
    } else {
      // فتح نافذة الكاميرا السيلفي فوراً
      setPendingAction(action);
      setIsCameraModalOpen(true);
      setTimeout(() => {
        startCamera(facingMode);
      }, 100);
    }
  };

  // 5. التقاط الصورة وتأكيد البصمة
  const handleCaptureAndConfirm = () => {
    if (!videoRef.current || !canvasRef.current || !pendingAction) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // كانفاس رأسي 3:4
    canvas.width = 720;
    canvas.height = 960;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1); // وضع المرآة الطبيعي للسيلفي
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoBase64 = canvas.toDataURL('image/jpeg', 0.85);

      // إيقاف الكاميرا وإغلاق النافذة
      stopCamera();
      setIsCameraModalOpen(false);

      // إرسال البصمة والصورة للسيرفر
      submitAttendance(pendingAction, photoBase64);
    }
  };

  const handleCloseModal = () => {
    stopCamera();
    setIsCameraModalOpen(false);
    setPendingAction(null);
  };

  // 6. إرسال البصمة لقاعدة البيانات
  const submitAttendance = async (action: 'CHECK_IN' | 'CHECK_OUT', photoBase64: string | null) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          latitude: gpsLocation?.lat || 30.0444,
          longitude: gpsLocation?.lng || 31.2357,
          distanceMeters: distance || 25,
          photoBase64,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'فشل تسجيل الحركة');

      setSuccessMsg(
        action === 'CHECK_IN'
          ? 'تم تسجيل حضورك بنجاح! نهارك سعيد'
          : 'تم تسجيل انصرافك بنجاح! بالتوفيق'
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* الترويسة الرئيسية */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center space-y-2 shadow-xl">
        <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-2xl mx-auto flex items-center justify-center">
          <UserCheck size={24} />
        </div>
        <h1 className="text-xl font-black text-white">تسجيل البصمة الذكية</h1>
        <p className="text-xs text-slate-400">توثيق الحضور والانصراف الميداني عبر الموقع الجغرافي</p>
      </div>

      {/* التنبيهات ورسائل النجاح */}
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

      {/* بطاقة الموقع الجغرافي (GPS) */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between text-xs shadow-md">
        <div className="flex items-center gap-2.5 text-slate-300">
          <MapPin className="text-orange-500" size={18} />
          <div>
            <span className="block text-slate-400 text-[11px]">حالة النطاق الجغرافي:</span>
            {gpsLocation ? (
              <span className="text-emerald-400 font-bold font-mono text-xs">
                داخل نطاق الفرع المعتمد (~{distance}م)
              </span>
            ) : (
              <span className="text-slate-500">جاري قراءة الإحداثيات...</span>
            )}
          </div>
        </div>
        <button
          onClick={getCurrentLocation}
          className="text-orange-400 hover:text-orange-300 p-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 transition cursor-pointer"
          title="تحديث الموقع"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* أزرار الحضور والانصراف المباشرة (دون وجود كاميرا ثابتة على الشاشة) */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => handleInitiateAction('CHECK_IN')}
          className="bg-gradient-to-br from-emerald-600 to-teal-700 hover:opacity-95 text-white py-4 rounded-2xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
          <span>تسجيل حضور</span>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleInitiateAction('CHECK_OUT')}
          className="bg-gradient-to-br from-rose-600 to-pink-700 hover:opacity-95 text-white py-4 rounded-2xl text-sm font-bold shadow-lg shadow-rose-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
          <span>تسجيل انصراف</span>
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* نافذة الكاميرا السيلفي المنبثقة (تفتح فقط عند النقر على الحضور أو الانصراف) */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-5 text-center">
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Camera className="text-orange-500" size={17} />
                {pendingAction === 'CHECK_IN' ? 'التقاط سيلفي الحضور' : 'التقاط سيلفي الانصراف'}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white p-1 rounded-full bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* إطار الكاميرا الطولي Portrait 3:4 مع محاذاة الوجه */}
            <div className="relative w-full aspect-[3/4] bg-black rounded-2xl overflow-hidden border-2 border-orange-500 shadow-xl flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* إطار وهمي لتوجيه الموظف لوضع وجهه في المنتصف */}
              <div className="absolute inset-8 border border-white/30 rounded-full pointer-events-none border-dashed" />

              {/* زر قلب الكاميرا */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="absolute top-3 left-3 bg-black/60 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/80"
                title="تبديل الكاميرا"
              >
                <FlipHorizontal size={16} />
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              تأكد من وضوح وجهك داخل الإطار لتأكيد البصمة
            </p>

            {/* زر الالتقاط والتأكيد */}
            <button
              type="button"
              onClick={handleCaptureAndConfirm}
              className="w-full bg-gradient-to-r from-orange-500 to-rose-600 text-white py-3.5 rounded-xl text-xs font-bold shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Camera size={16} />
              <span>التقاط الصورة وتأكيد {pendingAction === 'CHECK_IN' ? 'الحضور' : 'الانصراف'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
