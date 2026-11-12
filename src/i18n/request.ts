import { getRequestConfig } from 'next-intl/server';
// قائمة اللغات المدعومة في التطبيق
const locales = ['ar', 'en'];

export default getRequestConfig(async ({ requestLocale }) => {
  // فك لغة الطلب غير المتزامنة لتوافق Next.js 15+
  let locale = await requestLocale;

  // التحقق من صلاحية اللغة أو الرجوع للغة العربية كافتراضي
  if (!locale || !locales.includes(locale)) {
    locale = 'ar';
  }

  return {
    locale,
    // استدعاء ملف الترجمة المطابق من مجلد messages
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
