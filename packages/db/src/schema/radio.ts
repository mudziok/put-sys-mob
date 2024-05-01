import { relations, sql } from "drizzle-orm";
import { serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { geometry } from "../types/geometry";
import { myPgTable } from "./_table";
import { listen } from "./listen";

export const radio = myPgTable("radio", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  location: geometry("location", { type: "Point" }),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const radioRelations = relations(radio, ({ many }) => ({
  listens: many(listen),
}));
