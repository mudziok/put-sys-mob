import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { and, count, eq, schema, sql } from "@acme/db";

import { createTRPCRouter, publicProcedure } from "../trpc";
import { getUserProfile } from "./spotify";

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
    .input(z.object({ id: z.number(), accessToken: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      if (!input.accessToken) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "An unexpected error occurred, please try again later.",
        });
      }

      const profile = await getUserProfile({ accessToken: input.accessToken });
      console.log(profile);

      const [row] = await ctx.db
        .select()
        .from(schema.listen)
        .where(eq(schema.listen.id, input.id))
        .leftJoin(schema.radio, eq(schema.radio.id, schema.listen.radioId));

      if (!row) {
        throw new Error("Listen not found");
      }

      const { listen, radio } = row;

      const [countRow] = await ctx.db
        .select({ count: count() })
        .from(schema.listenReactions)
        .where(eq(schema.listenReactions.listenId, listen.id));

      const [userReactionRow] = await ctx.db
        .select()
        .from(schema.listenReactions)
        .where(
          and(
            eq(schema.listenReactions.listenId, listen.id),
            eq(schema.listenReactions.userId, profile.id),
          ),
        );

      const reactionCount = countRow?.count ?? 0;
      const isReacted = !!userReactionRow;

      return {
        ...listen,
        radio,
        reactionCount,
        isReacted,
      };
    }),
  setReaction: publicProcedure
    .input(
      z.object({
        isReacted: z.boolean(),
        listenId: z.number(),
        accessToken: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input: { isReacted, listenId, accessToken } }) => {
      if (!accessToken) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "An unexpected error occurred, please try again later.",
        });
      }

      const profile = await getUserProfile({ accessToken });

      if (isReacted) {
        await ctx.db.insert(schema.listenReactions).values({
          listenId,
          userId: profile.id,
        });
      } else {
        await ctx.db
          .delete(schema.listenReactions)
          .where(
            and(
              eq(schema.listenReactions.listenId, listenId),
              eq(schema.listenReactions.userId, profile.id),
            ),
          );
      }
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
