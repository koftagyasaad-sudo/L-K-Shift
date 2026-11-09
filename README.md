# L-K-Shift

## Quality checks

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before
merging. The GitHub Actions workflow runs all four checks on pushes to `main`
and pull requests, including an npm dependency audit.

The lint command currently enforces a warning budget of 322 findings from the
existing codebase. CI fails if that baseline grows; reduce the budget as legacy
warnings are fixed. `next build` also runs lint and type validation; the
standalone lint command additionally enforces the warning budget.

## Passwords and initial admin

Passwords must contain at least 6 characters. The first super-admin can be
created through `POST /api/setup-admin` after setting `SETUP_ADMIN_TOKEN` in the
deployment environment. Send the admin phone and password in the request body
over HTTPS; omit `fullNameAr` to use the display name `Admin`. Never commit
credentials or place them in source code.

## Database migrations

Schema changes are versioned in `drizzle/`. Generate and review migrations with
`npm run db:generate`, then apply pending migrations explicitly with
`npm run db:migrate`. Application builds do not change the database.

`drizzle/0000_baseline.sql` is the initial schema migration generated from
`src/db/schema.ts`. It creates a new, empty database; it is **not** safe to run
against an existing database that already contains these tables.
`drizzle/0001_add_query_indexes_and_phone_constraint.sql` adds query indexes
and enforces unique phone numbers, which are used as login identifiers. Drizzle
applies migrations in a transaction, so PostgreSQL's `CREATE INDEX CONCURRENTLY`
cannot be used here; schedule this migration during a low-traffic window because
index creation can block writes.
`drizzle/0002_ensure_password_reset_columns.sql` idempotently adds the password
reset OTP fields for databases whose existing `users` table predates them.

Before adopting this migration history for an existing staging or production
database:

1. Restore a recent backup into an isolated database and confirm that the restore
   works.
2. Compare the restored database's enums, tables, columns, defaults, constraints,
   and indexes with `src/db/schema.ts` and the migration files.
3. Before applying the unique phone index, check for duplicates with
   `SELECT phone, count(*) FROM users GROUP BY phone HAVING count(*) > 1;` and
   resolve any results through an approved data-cleanup plan.
4. If the schema differs, write and review explicit migrations to reconcile the
   differences. Do not mark the baseline as applied until the existing schema
   has been verified to match it.
5. Test the migrations and application against the isolated database before
   scheduling any production change.

The repository does not contain a staging database connection, so the baseline
has not been applied or recorded against any existing database. Never use
`drizzle-kit push` as a production deployment step.