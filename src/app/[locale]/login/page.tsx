"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const isRtl = locale === "ar";
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      // بيانات الدخول المطلوبة
      if (username === "010" && password === "123456") {
        // تسجيل الدخول محلياً للحماية
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem(
          "user",
          JSON.stringify({ name: "Omar Abd Elhalim", role: "مدير النظام" })
        );
        router.push(`/${locale}`); // التوجيه للوحة التحكم مباشرة
      } else {
        setError(isRtl ? "بيانات الدخول غير صحيحة" : "Invalid credentials");
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center p-4 relative overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      {/* خلفية زجاجية متحركة */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* اللوجو */}
        <div className="mb-6 flex flex-col items-center">
          <img src="/Logo.png" alt="L-K Shift Logo" className="h-20 w-auto mb-4 drop-shadow-xl" />
          <h1 className="text-3xl font-black text-white tracking-wider">L-K Shift</h1>
          <p className="text-gray-400 text-sm mt-2">{isRtl ? "نظام إدارة الحضور والورديات" : "Attendance & Shift Management"}</p>
        </div>

        {/* كارد تسجيل الدخول الزجاجي */}
        <div className="w-full bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <ShieldCheck className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-white">{isRtl ? "تسجيل الدخول" : "Login"}</h2>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">{isRtl ? "رقم الدخول" : "Username"}</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="010"
                className="w-full px-5 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-left"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">{isRtl ? "كلمة المرور" : "Password"}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-5 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all text-left"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/25 transition-all disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {isRtl ? "دخول" : "Login"}
                  <ArrowRight className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            {isRtl ? "صلاحيات مطلقة للنظام — استخدم 010 و 123456" : "Full Admin Access — Use 010 & 123456"}
          </p>
        </div>
      </div>
    </div>
  );
}
