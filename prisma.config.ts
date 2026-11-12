import { defineConfig } from "prisma/config";

// prisma migrate deploy requires a direct (non-pooled) database connection
// because it uses PostgreSQL advisory locks which are not supported through
// connection poolers (PgBouncer, Prisma Accelerate pooled endpoint, etc.).
//
// Set MIGRATE_DATABASE_URL to your direct connection string in Vercel:
//   - Neon: use the non-pooled connection string (port 5432, no pgbouncer param)
//   - Supabase: use the Session mode URL (port 5432, not Transaction mode 6543)
//   - Prisma Postgres: use the direct URL from your Prisma Console dashboard
//
// Falls back to DATABASE_URL if MIGRATE_DATABASE_URL is not set (fine for
// environments that already use a direct connection).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
  },
});
