import { z } from "zod";

import { schema, sql } from "@acme/db";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const listenRouter = createTRPCRouter({
  all: publicProcedure
    .input(z.object({ longitude: z.number(), latitude: z.number() }))
    .query(({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { longitude, latitude } = input;
      return (
        ctx.db
          .select()
          .from(schema.listen)
          // .where(
          //   sql`ST_DWithin(location, ST_SetSRID(ST_MakePoint(${longitude},${latitude}), 4326), 1000)`,
          // )
          .orderBy(sql`random()`)
          .limit(3)
      );
    }),
  create: publicProcedure
    .input(z.object({ longitude: z.number(), latitude: z.number() }))
    .mutation(({ ctx, input }) => {
      const { longitude, latitude } = input;
      return ctx.db.insert(schema.listen).values({
        location: { type: "Point", coordinates: [longitude, latitude] },
        title: "test",
      });
    }),
});
