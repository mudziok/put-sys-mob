import { relations, sql } from "drizzle-orm";
import { integer, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { geometry } from "../types/geometry";
import { myPgTable } from "./_table";
import { listenReactions } from "./listenReactions";
import { radio } from "./radio";

export const listen = myPgTable("listen", {
  id: serial("id").primaryKey(),
  title: varchar("name", { length: 256 }).notNull(),
  artist: varchar("artist", { length: 256 }).notNull(),
  location: geometry("location", { type: "Point" }),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updatedAt").defaultNow(),
  itemUri: varchar("item_uri", { length: 256 }).notNull(),
  contextUri: varchar("context_uri", { length: 256 }).notNull(),
  image: varchar("image", { length: 256 }),
  radioId: integer("radio_id"),
});

export const listenRelations = relations(listen, ({ one, many }) => ({
  radio: one(radio, {
    fields: [listen.radioId],
    references: [radio.id],
  }),
  reactions: many(listenReactions),
}));
