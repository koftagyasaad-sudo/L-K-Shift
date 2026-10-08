"use client";

import React, { useState, useEffect, useRef } from "react";

interface Branch {
  id: number;
  nameAr: string;
  latitude: number;
  longitude: number;
  geofenceRadius: number; // النطاق المسموح به بالأمتار
}

interface CheckInOutProps {
  userId: number;
  branch: Branch;
  onSuccess?: () => void;
}

export default function CheckInOutWidget({ userId, branch, onSuccess }: CheckInOutProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"CAMERA" | "LOCATION_ONLY">("CAMERA");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // حساب المسافة بالأمتار (Haversine Formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // نصف قطر الأرض بالأمتار
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  };

  // جلب الموقع الجغرافي للمستخدم
  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("خاصية تحديد الموقع الجغرافي غير مدعومة في جهازك"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });

          const dist = calculateDistance(lat, lng, branch.latitude, branch.longitude);
          setDistance(dist);
          resolve({ lat, lng });
        },
        (error) => {
          let errText = "فشل الحصول على الموقع الجغرافي";
          if (error.code === error.PERMISSION_DENIED) {
            errText = "رجاءً قم بتفعيل صلاحية الموقع (GPS) في المتصفح";
          }
          reject(new Error(errText));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  // تشغيل الكاميرا مع توافقية الموبايل
  const startCamera = async () => {
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("الكاميرا تتطلب الاتصال الآمن (HTTPS) أو غير مدعومة في هذا المتصفح");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      setErrorMessage(err.message || "عذرًا، تعذر فتح الكاميرا. تحقق من الصلاحيات");
      setCameraActive(false);
    }
  };

  // إيقاف الكاميرا
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // التقاط صورة
  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          setPhotoBlob(blob);
          setPhotoPreview(URL.createObjectURL(blob));
          stopCamera();
        }
      }, "image/jpeg", 0.8);
    }
  };

  // إعادة الالتقاط
  const resetPhoto = () => {
    setPhotoBlob(null);
    setPhotoPreview(null);
    startCamera();
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // تنفيذ تسجيل الحضور / الانصراف
  const handleAttendance = async (type: "CHECK_IN" | "CHECK_OUT") => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      // 1. التحقق من الموقع الجغرافي
      const loc = await getCurrentLocation();
      const currentDist = calculateDistance(loc.lat, loc.lng, branch.latitude, branch.longitude);

      if (currentDist > branch.geofenceRadius) {
        throw new Error(
          `أنت خارج نطاق الفرع المسموح به! المسافة الحالية: ${currentDist} متر (المسموح به حتى ${branch.geofenceRadius} متر)`
        );
      }

      // 2. التحقق من التقاط الصورة في حالة وضع الكاميرا
      if (mode === "CAMERA" && !photoBlob) {
        throw new Error("برجاء التقاط صورة وجهك أولاً لإتمام التسجيل");
      }

      // 3. تجهيز البيانات للإرسال
      const formData = new FormData();
      formData.append("userId", userId.toString());
      formData.append("branchId", branch.id.toString());
      formData.append("type", type);
      formData.append("latitude", loc.lat.toString());
      formData.append("longitude", loc.lng.toString());
      formData.append("distanceMeter", currentDist.toString());
      formData.append("mode", mode);

      if (photoBlob) {
        formData.append("photo", photoBlob, `attendance_${userId}_${Date.now()}.jpg`);
      }

      // 4. إرسال الطلب للسيرفر
      const response = await fetch("/api/attendance", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "حدث خطأ أثناء تسجيل الحضور");
      }

      setSuccessMessage(
        type === "CHECK_IN" ? "تم تسجيل الحضور بنجاح ✅" : "تم تسجيل الانصراف بنجاح ✅"
      );
      setPhotoBlob(null);
      setPhotoPreview(null);

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || "تعذر إكمال العملية");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 text-right dir-rtl max-w-md mx-auto">
      <h3 className="text-lg font-bold mb-3 text-slate-800 dark:text-slate-100">
        تسجيل الحضور والانصراف - {branch.nameAr}
      </h3>

      {/* خيارات وضع التسجيل */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => {
            setMode("CAMERA");
            startCamera();
          }}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition ${
            mode === "CAMERA"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300"
          }`}
        >
          📷 بالكاميرا
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("LOCATION_ONLY");
            stopCamera();
          }}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg border transition ${
            mode === "LOCATION_ONLY"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300"
          }`}
        >
          📍 باللوكيشن فقط
        </button>
      </div>

      {/* منطقة عرض الكاميرا أو المعاينة */}
      {mode === "CAMERA" && (
        <div className="relative mb-4 bg-slate-900 rounded-lg overflow-hidden h-64 flex items-center justify-center border">
          {photoPreview ? (
            <img src={photoPreview} alt="معاينة الصورة" className="w-full h-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
            />
          )}

          {!cameraActive && !photoPreview && (
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow hover:bg-blue-700 transition"
            >
              فتح الكاميرا
            </button>
          )}
        </div>
      )}

      {/* أزرار الكاميرا */}
      {mode === "CAMERA" && (
        <div className="mb-4">
          {cameraActive && !photoPreview && (
            <button
              onClick={takePhoto}
              className="w-full py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition"
            >
              التقاط الصورة
            </button>
          )}
          {photoPreview && (
            <button
              onClick={resetPhoto}
              className="w-full py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition"
            >
              إعادة التقاط الصورة
            </button>
          )}
        </div>
      )}

      {/* عرض تفاصيل المسافة */}
      {distance !== null && (
        <div className="text-xs mb-4 p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          المسافة بينك وبين الفرع: <span className="font-bold">{distance} متر</span> (المسموح: حتى{" "}
          {branch.geofenceRadius} متر)
        </div>
      )}

      {/* رسائل الأخطاء والنجاح */}
      {errorMessage && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-lg">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* أزرار تسجيل الحضور والانصراف */}
      <div className="flex gap-3">
        <button
          onClick={() => handleAttendance("CHECK_IN")}
          disabled={loading}
          className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition shadow"
        >
          {loading ? "جاري الحفظ..." : "تسجيل حضور"}
        </button>
        <button
          onClick={() => handleAttendance("CHECK_OUT")}
          disabled={loading}
          className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 disabled:opacity-50 transition shadow"
        >
          {loading ? "جاري الحفظ..." : "تسجيل انصراف"}
        </button>
      </div>
    </div>
  );
}
