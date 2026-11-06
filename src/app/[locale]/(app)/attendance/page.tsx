'use client';

import React, { useState, useEffect, useRef, use } from 'react';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

// دالة هافيرسين لحساب المسافة بدقة الأمتار
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

export default function LiveCameraAttendancePage({ params }: PageProps) {
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
  const [stepText, setStepText] = useState('');

  // الكاميرا الحية والسيلفي المباشر
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [attendanceType, setAttendanceType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // 1. تحميل بيانات الموظف والفرع
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
      if (bRes.ok) {
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
      }
    } catch (err) {
      console.error('Error init attendance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAttendance();
    return () => {
      // إيقاف بث الكاميرا عند الخروج من الصفحة
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 2. تشغيل الكاميرا الأمامية المباشرة
  const startLiveCamera = async (type: 'CHECK_IN' | 'CHECK_OUT') => {
    setStatusMessage(null);
    setCapturedPhoto(null);
    setAttendanceType(type);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatusMessage({ text: 'المتصفح أو الجهاز لا يدعم الوصول للكاميرا المباشرة', isError: true });
      return;
    }

    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // الكاميرا الأمامية
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setIsCameraActive(false);
      setStatusMessage({
        text: 'يرجى السماح بصلاحية الكاميرا في المتصفح لالتقاط الصورة الحية',
        isError: true,
      });
    }
  };

  // 3. التقاط الصورة الحية ثم فحص الموقع الجغرافي
  const captureLivePhotoAndProceed = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // رسم لقطة الكاميرا الحية على Canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoBase64 = canvas.toDataURL('image/jpeg', 0.65);
    setCapturedPhoto(photoBase64);

    // إغلاق الكاميرا لتوفير طاقة الهاتف
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsCameraActive(false);

    // متابعة فحص الـ GPS والإرسال
    processGpsAndSubmit(photoBase64);
  };

  // 4. قراءة الموقع ومطابقة النطاق
  const processGpsAndSubmit = (photo: string) => {
    if (!navigator.geolocation) {
      setStatusMessage({ text: 'المتصفح لا يدعم تحديد الموقع GPS', isError: true });
      return;
    }

    setIsProcessing(true);
    setStepText(isRtl ? 'جاري التحقق من إحداثيات موقعك الجغرافي...' : 'Verifying GPS location...');

    navigator.geolocation.getCurrentPosition(
      (pos) => submitAttendanceWithVerification(pos, photo),
      () => {
        navigator.geolocation.getCurrentPosition(
          (fallbackPos) => submitAttendanceWithVerification(fallbackPos, photo),
          () => {
            setIsProcessing(false);
            setStepText('');
            setStatusMessage({ text: 'تعذر الوصول للـ GPS، تأكد من تفعيل الموقع بالهاتف', isError: true });
          },
          { enableHighAccuracy: false, timeout: 6000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // 5. اعتماد وحفظ البصمة في السيرفر
  const submitAttendanceWithVerification = async (pos: GeolocationPosition, photo: string) => {
    setStepText(isRtl ? 'جاري اعتماد البصمة والصورة الحية بالسيرفر...' : 'Recording attendance on server...');

    const userLat = pos.coords.latitude;
    const userLng = pos.coords.longitude;
    setCurrentCoords({ lat: userLat, lng: userLng });

    const branchLat = parseFloat(currentBranch.latitude);
    const branchLng = parseFloat(currentBranch.longitude);
    const maxRadius = parseInt(currentBranch.radiusMeters || currentBranch.geofenceRadius || '100', 10);

    const rawDistance = calculateDistanceInMeters(userLat, userLng, branchLat, branchLng);
    setCurrentDistance(rawDistance);

    // هامش أمان لجدران المباني المغلقة
    const effectiveDistance = Math.max(0, rawDistance - 25);

    if (effectiveDistance > maxRadius) {
      setIsProcessing(false);
      setStepText('');
      setStatusMessage({
        text: `عفواً، لا يمكنك تسجيل البصمة! أنت خارج نطاق فرع (${currentBranch.nameAr || currentBranch.name}). المسافة: ${rawDistance} متر (الحد المسموح للفرع: ${maxRadius}م).`,
        isError: true,
      });
      return;
    }

    try {
      const uPhone = localStorage.getItem('userPhone') || '';
      const payload = {
        userId: userId || '1',
        userName: userName || 'موظف',
        userPhone: uPhone,
        branchId: currentBranch.id,
        branchName: currentBranch.nameAr || currentBranch.name || '',
        type: attendanceType,
        latitude: userLat,
        longitude: userLng,
        distanceMeters: rawDistance,
        isVerifiedGeofence: true,
        photoUrl: photo,
      };

      const saveRes = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!saveRes.ok) throw new Error('فشل حفظ البصمة في السيرفر');

      setStatusMessage({
        text: `تم تسجيل ${attendanceType === 'CHECK_IN' ? 'الحضور' : 'الانصراف'} مع الصورة الحية بنجاح تام! موقعك مطابق للفرع بنسبة 100% (المسافة: ${rawDistance}م).`,
        isError: false,
      });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'حدث خطأ أثناء اعتماد البصمة بالسيرفر', isError: true });
    } finally {
      setIsProcessing(false);
      setStepText('');
    }
  };

  const isAdmin = userRole === 'مدير النظام' || userRole === 'SUPER_ADMIN' || userRole === 'admin';

  return (
    <div className="space-y-6 max-w-4xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-white/5 dark:bg-[#121526]/80 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              {isRtl ? 'تسجيل البصمة الذكية بالصورة الحية' : 'Live Camera Smart Attendance'}
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

        {/* كارت الفرع */}
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
                    onChange={(e) => {
                      setSelectedBranchId(e.target.value);
                      const f = branchesList.find((b) => String(b.id) === e.target.value);
                      if (f) setCurrentBranch(f);
                    }}
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
              <div><strong>إحداثيات الفرع:</strong></div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                Lat: {currentBranch?.latitude || '—'} | Lng: {currentBranch?.longitude || '—'}
              </div>
              <div className="text-[11px]">
                نطاق السماح: <strong className="text-orange-600 font-bold">{currentBranch?.radiusMeters || 100} متر</strong>
              </div>
            </div>
          </div>
        </div>

        {/* عارض الكاميرا الحية المباشرة (Live Camera Stream) */}
        {isCameraActive && (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-orange-500 p-4 text-center bg-black/50 backdrop-blur-md">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-bold text-orange-400 mb-3">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
              <span>الكاميرا تعمل بث مباشر - التقط صورة وجهك الآن</span>
            </div>

            <div className="relative mx-auto w-full max-w-sm aspect-video rounded-xl overflow-hidden bg-black shadow-2xl border border-white/10">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100" // المرآة العاكسة
              />
            </div>

            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={captureLivePhotoAndProceed}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 hover:opacity-95 cursor-pointer"
              >
                📸 التقط الصورة وسجل البصمة فوراً
              </button>
              <button
                type="button"
                onClick={() => {
                  if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
                  setIsCameraActive(false);
                }}
                className="rounded-xl border border-slate-400 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* معاينة الصورة الملتقطة */}
        {capturedPhoto && !isCameraActive && (
          <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 w-fit">
            <img src={capturedPhoto} alt="Live Selfie" className="w-16 h-12 rounded-lg object-cover border border-orange-500" />
            <span className="text-xs text-emerald-400 font-bold">✓ تم التقاط صورتك الحية بنجاح</span>
          </div>
        )}

        {stepText && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 text-xs font-bold text-orange-600 dark:text-orange-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            <span>{stepText}</span>
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

        {/* أزرار الحضور والانصراف الرئيسية */}
        {!isCameraActive && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              disabled={isProcessing || isLoading || !currentBranch}
              onClick={() => startLiveCamera('CHECK_IN')}
              className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-lg transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
            >
              <span className="text-3xl">📍</span>
              <span className="mt-2 text-lg font-black">{isRtl ? 'تسجيل حضور' : 'Check-In'}</span>
              <span className="text-[11px] opacity-80">{isRtl ? 'فتح الكاميرا والتقاط سيلفي الحضور' : 'Take selfie & check in'}</span>
            </button>

            <button
              type="button"
              disabled={isProcessing || isLoading || !currentBranch}
              onClick={() => startLiveCamera('CHECK_OUT')}
              className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 p-6 text-white shadow-lg transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
            >
              <span className="text-3xl">🚪</span>
              <span className="mt-2 text-lg font-black">{isRtl ? 'تسجيل انصراف' : 'Check-Out'}</span>
              <span className="text-[11px] opacity-80">{isRtl ? 'فتح الكاميرا والتقاط سيلفي الانصراف' : 'Take selfie & check out'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
