import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  eslint: {
    // يمنع أخطاء التنظيف البسيطة (unused vars etc.) من إيقاف عملية الـ Build في الإنتاج
    ignoreDuringBuilds: true,
  },
};

export default withNextIntl(nextConfig);
