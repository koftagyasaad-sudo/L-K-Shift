import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];

export function isValidLocale(locale: string | undefined | null): locale is AppLocale {
  if (!locale) {
    return false;
  }

  return (routing.locales as readonly string[]).includes(locale);
}
