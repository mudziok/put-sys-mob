import type { Config } from "drizzle-kit";

export default {
  dialect: "postgresql",
  schema: "./src/schema",
  dbCredentials: {
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "mysecretpassword",
    database: "postgres",
  },
  verbose: true,
  tablesFilter: ["t3turbo_*"],
} satisfies Config;
