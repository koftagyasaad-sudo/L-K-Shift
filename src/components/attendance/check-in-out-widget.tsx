"use client";

import React, { useState, useEffect, useRef } from "react";

interface Branch {
  id: number;
  nameAr: string;
  latitude: number;
  longitude: number;
  geofenceRadius: number;
}

interface CheckInOutProps {
  userId?: number;
  branch?: Branch;
  locale?: "ar" | "en";
  initialType?: "CHECK_IN" | "CHECK_OUT" | null;
  onSuccess?: () => void;
  onClose?: () => void;
}

export function CheckInOutWidget({
  userId,
  branch,
  locale = "ar",
  initialType = null,
  onSuccess,
  onClose,
}: CheckInOutProps) {
  const isAr = locale === "ar";
  const [loading, setLoading] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"CHECK_IN" | "CHECK_OUT">(initialType || "CHECK_IN");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activeBranch: Branch = branch || {
    id: 1,
    nameAr: "الفرع الرئيسي",
    latitude: 30.0444,
    longitude: 31.2357,
    geofenceRadius: 100,
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
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

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error(isAr ? "خاصية GPS غير مدعومة في جهازك" : "Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });

          const dist = calculateDistance(lat, lng, activeBranch.latitude, activeBranch.longitude);
          setDistance(dist);
          resolve({ lat, lng });
        },
        (error) => {
          let errText = isAr ? "فشل الحصول على موقع الـ GPS" : "Failed to get location";
          if (error.code === error.PERMISSION_DENIED) {
            errText = isAr ? "يرجى تفعيل إذن استخدام الـ GPS في المتصفح" : "GPS permission denied";
          }
          reject(new Error(errText));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const startCamera = async () => {
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(isAr ? "الكاميرا تتطلب الاتصال الآمن (HTTPS)" : "HTTPS required for camera");
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
      setErrorMessage(err.message || (isAr ? "تعذر فتح الكاميرا" : "Camera access failed"));
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

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
      }, "image/jpeg", 0.85);
    }
  };

  const resetPhoto = () => {
    setPhotoBlob(null);
    setPhotoPreview(null);
    startCamera();
  };

  useEffect(() => {
    startCamera();
    getCurrentLocation().catch(() => {});
    return () => {
      stopCamera();
    };
  }, []);

  const handleAttendanceSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!photoBlob) {
      setErrorMessage(isAr ? "يرجى التقاط صورة الوجه أولاً" : "Please take a live photo first");
      return;
    }

    setLoading(true);

    try {
      const loc = await getCurrentLocation();
      const endpoint = activeType === "CHECK_IN" ? "/api/attendance/check-in" : "/api/attendance/check-out";

      const formData = new FormData();
      formData.append("photo", photoBlob, `selfie_${Date.now()}.jpg`);
      formData.append("lat", loc.lat.toString());
      formData.append("lng", loc.lng.toString());

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || (isAr ? "فشل التسجيل" : "Registration failed"));
      }

      const msg = activeType === "CHECK_IN" 
        ? (isAr ? "تم تسجيل الحضور بنجاح ✅" : "Check-in successful ✅")
        : (isAr ? "تم تسجيل الانصراف بنجاح ✅" : "Check-out successful ✅");

      setSuccessMessage(msg);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || (isAr ? "حدث خطأ غير متوقع" : "Unexpected error occurred"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 text-start dir-rtl max-w-md w-full mx-auto space-y-4">
      <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {activeType === "CHECK_IN" ? (isAr ? "تسجيل حضور" : "Check In") : (isAr ? "تسجيل انصراف" : "Check Out")}
          </h3>
          <p className="text-[11px] text-gray-500">{activeBranch.nameAr}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800">
            ✕
          </button>
        )}
      </div>

      {/* نوع الحركة */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveType("CHECK_IN")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeType === "CHECK_IN"
              ? "bg-green-600 text-white shadow-md"
              : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300"
          }`}
        >
          {isAr ? "تسجيل حضور" : "Check In"}
        </button>
        <button
          type="button"
          onClick={() => setActiveType("CHECK_OUT")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeType === "CHECK_OUT"
              ? "bg-red-600 text-white shadow-md"
              : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300"
          }`}
        >
          {isAr ? "تسجيل انصراف" : "Check Out"}
        </button>
      </div>

      {/* معاينة الكاميرا */}
      <div className="relative bg-black rounded-2xl overflow-hidden h-56 flex items-center justify-center border border-gray-200 dark:border-slate-800">
        {photoPreview ? (
          <img src={photoPreview} alt="Live Selfie" className="w-full h-full object-cover" />
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
            type="button"
            onClick={startCamera}
            className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl shadow hover:bg-orange-600 transition"
          >
            {isAr ? "فتح الكاميرا" : "Open Camera"}
          </button>
        )}
      </div>

      {/* زري الالتقاط والإعادة */}
      <div>
        {cameraActive && !photoPreview && (
          <button
            type="button"
            onClick={takePhoto}
            className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold rounded-xl hover:opacity-95 transition shadow-sm"
          >
            {isAr ? "التقاط صورة لايف 📸" : "Take Live Photo 📸"}
          </button>
        )}
        {photoPreview && (
          <button
            type="button"
            onClick={resetPhoto}
            className="w-full py-2 bg-gray-600 text-white text-xs font-semibold rounded-xl hover:bg-gray-700 transition"
          >
            {isAr ? "إعادة التقاط الصورة" : "Retake Photo"}
          </button>
        )}
      </div>

      {/* المسافة */}
      {distance !== null && (
        <div className="text-[11px] p-2.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-800 dark:text-orange-200 border border-orange-200/50">
          {isAr ? "المسافة للفرع:" : "Distance to branch:"} <span className="font-bold">{distance} {isAr ? "متر" : "m"}</span>
          {" "}({isAr ? "النطاق:" : "Allowed:"} {activeBranch.geofenceRadius} {isAr ? "متر" : "m"})
        </div>
      )}

      {errorMessage && (
        <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="p-3 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200">
          {successMessage}
        </div>
      )}

      {/* زر الحفظ التفاعلي */}
      <button
        type="button"
        onClick={handleAttendanceSubmit}
        disabled={loading || !photoBlob}
        className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold rounded-xl shadow-lg disabled:opacity-50 transition active:scale-98"
      >
        {loading ? (isAr ? "جاري التحقق والارسال..." : "Verifying & Sending...") : (isAr ? "إرسال حركات الحضور الان" : "Submit Attendance")}
      </button>
    </div>
  );
}

export default CheckInOutWidget;
