import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/mysql-schema.ts",
  out: "./drizzle/migrations",
  dialect: "mysql",
  dbCredentials: {
    url: "mysql://user:password@localhost:3306/sheamarket"
  }
} satisfies Config;