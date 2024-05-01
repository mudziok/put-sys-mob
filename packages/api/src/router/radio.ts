import { z } from "zod";

import { eq, schema, sql } from "@acme/db";

import { createTRPCRouter, publicProcedure } from "../trpc";

const RADIO_DISCOVERY_RADIUS = 1.0;

type Radio = typeof schema.radio.$inferSelect;
type Listen = typeof schema.listen.$inferSelect;

export const radioRouter = createTRPCRouter({
  all: publicProcedure
    .input(z.object({ longitude: z.number(), latitude: z.number() }))
    .query(async ({ ctx, input }) => {
      const { longitude, latitude } = input;
      const rows = await ctx.db
        .select()
        .from(schema.radio)
        .where(
          // TODO: 't3turbo_radio.location' can probably be replaced with auto-generated schema
          sql`ST_DWithin(t3turbo_radio.location, ST_SetSRID(ST_MakePoint(${longitude},${latitude}), 4326), ${RADIO_DISCOVERY_RADIUS})`,
        )
        .leftJoin(schema.listen, eq(schema.radio.id, schema.listen.radioId));

      const result = rows.reduce<
        Record<number, { radio: Radio; listens: Listen[] }>
      >((acc, row) => {
        const { listen, radio } = row;
        if (!acc[radio.id]) {
          acc[radio.id] = { radio, listens: [] };
        }
        if (listen) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - data is left joined over radios
          acc[radio.id].listens.push(listen);
        }
        return acc;
      }, {});

      return Object.values(result).map(({ radio, listens }) => ({
        ...radio,
        listens,
      }));
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
});
