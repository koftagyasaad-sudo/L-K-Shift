"use client";

import React, { useState, useEffect, useRef } from "react";
import { saveOfflineAttendance, syncOfflineAttendance } from "@/lib/offline-sync";

interface Branch {
  id: number;
  nameAr: string;
  latitude: number;
  longitude: number;
  geofenceRadius: number; // النطاق المسموح به بالأمتار
}

interface CheckInOutProps {
  userId?: number;
  branch?: Branch;
  locale?: "ar" | "en";
  onSuccess?: () => void;
}

export function CheckInOutWidget({ userId = 1, branch, locale = "ar", onSuccess }: CheckInOutProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"CAMERA" | "LOCATION_ONLY">("CAMERA");
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // قيم افتراضية للفرع في حالة عدم تمرير الفرع كـ prop
  const activeBranch: Branch = branch || {
    id: 1,
    nameAr: "الفرع الرئيسي",
    latitude: 30.0444,
    longitude: 31.2357,
    geofenceRadius: 100,
  };

  // مراجعة حالة الاتصال بالإنترنت ومزامنة البيانات المعلقة تلقائيًا
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      const res = await syncOfflineAttendance();
      if (res.syncedCount > 0) {
        setSuccessMessage(`تمت مزامنة ${res.syncedCount} سجلات حضور معلقة بنجاح ✅`);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    syncOfflineAttendance();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // حساب المسافة بالأمتار (Haversine Formula)
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

          const dist = calculateDistance(lat, lng, activeBranch.latitude, activeBranch.longitude);
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

  // تشغيل الكاميرا
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

  // تحويل Blob إلى Base64 للحفظ الأوفلاين
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // تنفيذ تسجيل الحضور / الانصراف
  const handleAttendance = async (type: "CHECK_IN" | "CHECK_OUT") => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const loc = await getCurrentLocation();
      const currentDist = calculateDistance(loc.lat, loc.lng, activeBranch.latitude, activeBranch.longitude);

      if (currentDist > activeBranch.geofenceRadius) {
        throw new Error(
          `أنت خارج نطاق الفرع المسموح به! المسافة الحالية: ${currentDist} متر (المسموح به حتى ${activeBranch.geofenceRadius} متر)`
        );
      }

      if (mode === "CAMERA" && !photoBlob) {
        throw new Error("برجاء التقاط صورة وجهك أولاً لإتمام التسجيل");
      }

      if (!navigator.onLine) {
        let photoBase64: string | undefined = undefined;
        if (photoBlob) {
          photoBase64 = await blobToBase64(photoBlob);
        }

        await saveOfflineAttendance({
          userId,
          branchId: activeBranch.id,
          type,
          latitude: loc.lat.toString(),
          longitude: loc.lng.toString(),
          timestamp: new Date().toISOString(),
          photoBase64,
          mode,
        });

        setSuccessMessage("تم حفظ التسجيل محليًا (أوفلاين) 📶 وسيتزامن تلقائيًا عند توفر الإنترنت");
        setPhotoBlob(null);
        setPhotoPreview(null);
        if (onSuccess) onSuccess();
        return;
      }

      const formData = new FormData();
      formData.append("userId", userId.toString());
      formData.append("branchId", activeBranch.id.toString());
      formData.append("type", type);
      formData.append("latitude", loc.lat.toString());
      formData.append("longitude", loc.lng.toString());
      formData.append("distanceMeter", currentDist.toString());
      formData.append("mode", mode);

      if (photoBlob) {
        formData.append("photo", photoBlob, `attendance_${userId}_${Date.now()}.jpg`);
      }

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
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          تسجيل الحضور - {activeBranch.nameAr}
        </h3>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
            isOnline ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {isOnline ? "متصل بالإنترنت 🟢" : "أوفلاين 🟡"}
        </span>
      </div>

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
