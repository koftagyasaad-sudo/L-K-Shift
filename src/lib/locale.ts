import { routing } from "@/i18n/routing";

export type AppLocale = (typeof routing.locales)[number];

export function isRtl(locale: string) {
  return locale === "ar";
}

export function getLocaleFromPathname(pathname: string) {
  const segment = pathname.split("/").filter(Boolean)[0];
  return routing.locales.includes(segment as AppLocale) ? (segment as AppLocale) : routing.defaultLocale;
}
