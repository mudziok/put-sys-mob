import type { Config } from "drizzle-kit";

export default {
  driver: "pg",
  schema: "./src/schema",
  dbCredentials: {
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "mysecretpassword",
    database: "db",
  },
  verbose: true,
  tablesFilter: ["t3turbo_*"],
} satisfies Config;
