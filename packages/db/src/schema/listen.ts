import { sql } from "drizzle-orm";
import { serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { geometry } from "../types/geometry";
import { mySqlTable } from "./_table";

export const listen = mySqlTable("listen", {
  id: serial("id").primaryKey(),
  title: varchar("name", { length: 256 }).notNull(),
  location: geometry("location", { type: "Point" }),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});
