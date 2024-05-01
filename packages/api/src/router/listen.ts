import { z } from "zod";

import { eq, schema, sql } from "@acme/db";

import { createTRPCRouter, publicProcedure } from "../trpc";

const MAP_DISCOVERY_RADIUS = 0.1;

export const listenRouter = createTRPCRouter({
  all: publicProcedure
    .input(z.object({ longitude: z.number(), latitude: z.number() }))
    .query(({ ctx, input }) => {
      const { longitude, latitude } = input;
      return ctx.db
        .select()
        .from(schema.listen)
        .where(
          sql`ST_DWithin(location, ST_SetSRID(ST_MakePoint(${longitude},${latitude}), 4326), ${MAP_DISCOVERY_RADIUS})`,
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
    .mutation(async ({ ctx, input }) => {
      const { longitude, latitude, title, uri, image } = input;
      await ctx.db.transaction(async (tx) => {
        // TODO: Important! this query needs to find the radio
        // closest to the listen location instead of a random one
        const radio = await tx.query.radio.findFirst({});
        if (!radio) {
          tx.rollback();
          return;
        }
        return await tx.insert(schema.listen).values({
          location: { type: "Point", coordinates: [longitude, latitude] },
          image,
          uri,
          title,
          radioId: radio.id,
        });
      });
    }),
});
