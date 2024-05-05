import { relations } from "drizzle-orm";
import { integer, primaryKey, varchar } from "drizzle-orm/pg-core";

import { myPgTable } from "./_table";
import { listen } from "./listen";

export const listenReactions = myPgTable(
  "listen_reactions",
  {
    userId: varchar("user_id").notNull(),
    listenId: integer("listen_id").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.listenId] }),
  }),
);

export const listenReactionsRelations = relations(
  listenReactions,
  ({ one }) => ({
    listen: one(listen, {
      fields: [listenReactions.listenId],
      references: [listen.id],
    }),
  }),
);
