# Project Instructions

## Stack and structure
- This is a Next.js 15 App Router application using React 19, TypeScript, Tailwind CSS, NextAuth, `next-intl`, and Drizzle ORM with PostgreSQL.
- Application code lives under `src/`. Use the `@/*` TypeScript alias for imports from `src/*`.
- Locale-aware routes live under `src/app/[locale]`. Supported locales are Arabic (`ar`, the default) and English (`en`); keep user-facing strings in `messages/ar.json` and `messages/en.json`.
- Database tables and enums are defined in `src/db/schema.ts`; database access is centralized in `src/lib/db.ts` and `src/db/`.
- Server actions live in `src/actions/`, API route handlers in `src/app/api/`, and reusable UI in `src/components/`.

## Change conventions
- Preserve strict TypeScript types and follow nearby code patterns. Prefer existing utilities and UI components over adding new abstractions or dependencies.
- Keep authentication and permission checks on the server for protected actions and routes.
- Keep database schema changes and their consumers consistent. Do not run database push commands unless the task explicitly requires a database change to be applied.
- Keep Arabic and English translations in sync when changing user-facing text.
- Avoid unrelated edits and generated output.

## Validation
- `npm run build` runs `next build` after clearing `.next`.
- `npm run lint` is the configured lint command.
- No test script is defined in `package.json`; use focused checks available for the files changed.