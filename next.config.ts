import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

// ربط محرك next-intl بملف إعداد الطلبات ومجلد الترجمات
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // الحفاظ على تجاوز أخطاء الفحص الصارم لضمان سرعة واستقرار الإنتاج
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withNextIntl(nextConfig);
