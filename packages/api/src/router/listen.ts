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
      const [row] = await ctx.db
        .select()
        .from(schema.listen)
        .where(eq(schema.listen.id, input.id))
        .leftJoin(schema.radio, eq(schema.radio.id, schema.listen.radioId));

      if (!row) {
        throw new Error("Listen not found");
      }

      const { listen, radio } = row;

      return {
        ...listen,
        radio,
      };
    }),
  create: publicProcedure
    .input(
      z.object({
        longitude: z.number(),
        latitude: z.number(),
        title: z.string(),
        artist: z.string(),
        uri: z.string(),
        image: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { longitude, latitude, title, uri, image, artist } = input;

      await ctx.db.transaction(async (tx) => {
        const [closestRadio] = await tx
          .select()
          .from(schema.radio)
          .orderBy(
            sql`location <-> ST_SetSRID(ST_Point(${longitude}, ${latitude}), 4326)`,
          )
          .limit(1);

        if (!closestRadio) {
          tx.rollback();
          return;
        }

        return await tx.insert(schema.listen).values({
          location: { type: "Point", coordinates: [longitude, latitude] },
          artist,
          image,
          uri,
          title,
          radioId: closestRadio.id,
        });
      });
    }),
});
