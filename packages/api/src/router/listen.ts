import { z } from "zod";

import { eq, schema, sql } from "@acme/db";

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
          // TODO: filter by nearest location, following code sadly doesn't work
          // .where(
          //   sql`ST_DWithin(location, ST_SetSRID(ST_MakePoint(${longitude},${latitude}), 4326), 1000)`,
          // )
          .orderBy(sql`random()`)
      );
    }),
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const listen = await ctx.db.query.listen.findFirst({
        where: eq(schema.listen.id, input.id),
      });

      if (!listen) {
        throw new Error("Listen not found");
      }

      return listen;
    }),
  create: publicProcedure
    .input(
      z.object({
        longitude: z.number(),
        latitude: z.number(),
        title: z.string(),
        uri: z.string(),
        image: z.string().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const { longitude, latitude, title, uri, image } = input;
      return ctx.db.insert(schema.listen).values({
        location: { type: "Point", coordinates: [longitude, latitude] },
        image,
        uri,
        title,
      });
    }),
});
