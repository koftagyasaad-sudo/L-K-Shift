"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Clock, Loader2, MapPin, AlertTriangle, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";

type AttendanceRecord = {
  id: number;
  checkInTime: string | null;
  checkOutTime: string | null;
} | null;

export function CheckInOutWidget({ locale }: { locale: "ar" | "en" }) {
  const isAr = locale === "ar";
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [loadingToday, setLoadingToday] = useState(true);
  const [record, setRecord] = useState<AttendanceRecord>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const mode: "checkIn" | "checkOut" | "done" = !record?.checkInTime
    ? "checkIn"
    : !record?.checkOutTime
      ? "checkOut"
      : "done";

  async function loadToday() {
    setLoadingToday(true);
    try {
      const res = await fetch("/api/attendance/today");
      const data = await res.json();
      setRecord(data.record);
    } finally {
      setLoadingToday(false);
    }
  }

  useEffect(() => {
    loadToday();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOpen(true);
    } catch {
      setCameraError(
        isAr
          ? "تعذر الوصول إلى الكاميرا. يرجى السماح بالصلاحية من إعدادات المتصفح."
          : "Could not access camera. Please allow camera permission."
      );
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  function getLocation(): Promise<{ lat: number | null; lng: number | null }> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: null, lng: null });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({ lat: null, lng: null }),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
  }

  async function captureAndSubmit() {
    if (!videoRef.current || !canvasRef.current) return;
    setSubmitting(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // تصغير الصورة لتخفيف حجم الرفع
      const maxWidth = 720;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85)
      );

      if (!blob) throw new Error("Failed to capture photo");

      const { lat, lng } = await getLocation();

      const formData = new FormData();
      formData.append("photo", blob, "capture.jpg");
      if (lat !== null && lng !== null) {
        formData.append("lat", String(lat));
        formData.append("lng", String(lng));
      }

      const endpoint = mode === "checkIn" ? "/api/attendance/check-in" : "/api/attendance/check-out";
      const res = await fetch(endpoint, { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? (isAr ? "حدث خطأ" : "Something went wrong"));
        return;
      }

      if (data.approvalStatus === "AUTO_APPROVED") {
        toast.success(
          mode === "checkIn"
            ? isAr ? "تم تسجيل حضورك بنجاح ✅" : "Checked in successfully ✅"
            : isAr ? "تم تسجيل انصرافك بنجاح ✅" : "Checked out successfully ✅"
        );
      } else {
        toast.warning(
          isAr
            ? "تم إرسال طلبك للمراجعة من قِبل المدير (تعذر تأكيد الموقع)"
            : "Your request is pending manager review (location could not be verified)"
        );
      }

      stopCamera();
      await loadToday();
      router.refresh();
    } catch {
      toast.error(isAr ? "حدث خطأ أثناء التسجيل" : "Error while submitting");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingToday) {
    return (
      <div className="flex items-center justify-center rounded-[28px] border border-border bg-surface p-10">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">
          {isAr ? "تسجيل الحضور والانصراف" : "Attendance Check-In/Out"}
        </h2>
        {mode !== "done" && (
          <span className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <Clock className="h-3.5 w-3.5" />
            {new Date().toLocaleTimeString(isAr ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      <div className="mt-5">
        {mode === "done" ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-emerald-500/10 p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            <p className="font-bold text-emerald-700">
              {isAr ? "لقد أكملت حضورك وانصرافك لهذا اليوم" : "You have completed your attendance for today"}
            </p>
          </div>
        ) : !cameraOpen ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full ${
                mode === "checkIn" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
              }`}
            >
              {mode === "checkIn" ? <LogIn className="h-7 w-7" /> : <LogOut className="h-7 w-7" />}
            </div>
            <p className="text-sm text-foreground-muted">
              {mode === "checkIn"
                ? isAr
                  ? "اضغط لالتقاط صورة وتسجيل حضورك الآن"
                  : "Tap to take a photo and check in now"
                : isAr
                  ? "اضغط لالتقاط صورة وتسجيل انصرافك الآن"
                  : "Tap to take a photo and check out now"}
            </p>
            {record?.checkInTime && mode === "checkOut" && (
              <p className="text-xs text-foreground-muted">
                {isAr ? "وقت الحضور: " : "Checked in at: "}
                {new Date(record.checkInTime).toLocaleTimeString(isAr ? "ar-EG" : "en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
            <button
              type="button"
              onClick={openCamera}
              className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg transition ${
                mode === "checkIn"
                  ? "bg-emerald-600 shadow-emerald-600/30 hover:bg-emerald-700"
                  : "bg-amber-600 shadow-amber-600/30 hover:bg-amber-700"
              }`}
            >
              <Camera className="h-4 w-4" />
              {mode === "checkIn"
                ? isAr ? "تسجيل حضور" : "Check In"
                : isAr ? "تسجيل انصراف" : "Check Out"}
            </button>
            {cameraError && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-danger">
                <AlertTriangle className="h-3.5 w-3.5" />
                {cameraError}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-black">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video ref={videoRef} className="w-full" playsInline muted />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
              <MapPin className="h-3.5 w-3.5" />
              {isAr ? "سيتم تحديد موقعك تلقائيًا عند التقاط الصورة" : "Your location will be captured automatically"}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={stopCamera}
                disabled={submitting}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground-muted transition hover:bg-background-secondary disabled:opacity-50"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={captureAndSubmit}
                disabled={submitting}
                className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary-hover disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {isAr ? "التقاط وتأكيد" : "Capture & Confirm"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
