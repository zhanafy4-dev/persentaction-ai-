import "dotenv/config";
import { defineConfig } from "prisma/config";

// prisma generate does not connect; placeholder only when DATABASE_URL is unset (Docker/CI build).
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://build:build@127.0.0.1:5432/build?schema=public";

export default defineConfig({
  datasource: {
    url: databaseUrl,
  },
});

