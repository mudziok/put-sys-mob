import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { DB } from "@acme/db";
import { eq, schema, sql } from "@acme/db";

import { env } from "../../env";
import { createTRPCRouter, publicProcedure } from "../trpc";

const client_id = env.AUTH_SPOTIFY_CLIENT_ID;
const client_secret = env.AUTH_SPOTIFY_CLIENT_SECRET;
const redirect_uri = env.AUTH_SPOTIFY_REDIRECT_URI;

const itemSchema = z.object({
  album: z.object({
    images: z.array(z.object({ url: z.string() })),
    uri: z.string(),
  }),
  name: z.string(),
  artists: z.array(z.object({ name: z.string() })),
  uri: z.string(),
});

const playbackSchema = z.object({
  item: itemSchema.nullable(),
});

async function incrementPlayCount({
  itemUri,
  db,
}: {
  itemUri: string;
  db: DB;
}) {
  await db
    .update(schema.listen)
    .set({ playCount: sql`${schema.listen.playCount} + 1` })
    .where(eq(schema.listen.itemUri, itemUri));
}

async function addToQueue({
  uri,
  accessToken,
}: {
  uri: string;
  accessToken: string;
}) {
  const searchParams = new URLSearchParams({
    uri,
  }).toString();

  const res = await fetch(
    "https://api.spotify.com/v1/me/player/queue?" + searchParams,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!res.ok) {
    console.error(await res.json());
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not make request to Spotify API.",
    });
  }
}

// TODO: Wrap this function with some sort of caching mechanism
export async function getUserProfile({ accessToken }: { accessToken: string }) {
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not recieve data from Spotify API.",
    });
  }

  const profileSchema = z.object({
    id: z.string(),
    display_name: z.string(),
  });

  return profileSchema.parse(await res.json());
}

// TODO: Maybe wrap this function with some sort of caching mechanism
export async function getUsersQueue({ accessToken }: { accessToken: string }) {
  const res = await fetch("https://api.spotify.com/v1/me/player/queue", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not recieve data from Spotify API.",
    });
  }

  const queueSchema = z.object({
    queue: z.array(
      z.object({
        uri: z.string(),
      }),
    ),
  });

  return queueSchema.parse(await res.json());
}

export async function getPlayback({ accessToken }: { accessToken: string }) {
  const res = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing?market=US",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!res.ok) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Could not recieve data from Spotify API.",
    });
  }

  if (res.headers.get("content-type") === null) {
    return { isPlaying: false as const };
  }

  const { item } = playbackSchema.parse(await res.json());

  if (!item) {
    return { isPlaying: false as const };
  }

  return { item, isPlaying: true as const };
}

export const spotifyRouter = createTRPCRouter({
  getAccessToken: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input: { code } }) => {
      const params = new URLSearchParams();
      params.append("code", code);
      params.append("grant_type", "authorization_code");
      params.append("redirect_uri", redirect_uri);

      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(client_id + ":" + client_secret).toString("base64"),
        },
        body: params,
      });

      const tokenSchema = z.object({
        access_token: z.string(),
        token_type: z.string(),
      });

      const { access_token: accessToken } = tokenSchema.parse(await res.json());
      return { accessToken };
    }),
  getCurrenlyPlaying: publicProcedure
    .input(z.object({ accessToken: z.string().optional() }))
    .query(async ({ input: { accessToken } }) => {
      if (!accessToken) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No access token provided.",
        });
      }

      return getPlayback({ accessToken });
    }),
  play: publicProcedure
    .input(
      z.object({
        accessToken: z.string().optional(),
        contextUri: z.string(),
        itemUri: z.string(),
      }),
    )
    .mutation(async ({ input: { accessToken, contextUri, itemUri }, ctx }) => {
      if (!accessToken) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No access token provided.",
        });
      }

      const res = await fetch("https://api.spotify.com/v1/me/player/play", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          context_uri: contextUri,
          offset: {
            uri: itemUri,
          },
        }),
      });

      if (!res.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not make request to Spotify API.",
        });
      }

      await incrementPlayCount({ db: ctx.db, itemUri });
    }),
  addToQueue: publicProcedure
    .input(
      z.object({
        accessToken: z.string().optional(),
        uris: z.string().array(),
      }),
    )
    .mutation(async ({ input: { accessToken, uris } }) => {
      if (!accessToken) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No access token provided.",
        });
      }

      for (const uri of uris) {
        await addToQueue({ uri, accessToken });
      }
    }),
  getProfile: publicProcedure
    .input(z.object({ accessToken: z.string().optional(), uri: z.string() }))
    .query(async ({ input: { accessToken } }) => {
      if (!accessToken) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "An unexpected error occurred, please try again later.",
        });
      }

      return getUserProfile({ accessToken });
    }),
  requestAutoplay: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        longitude: z.number(),
        latitude: z.number(),
      }),
    )
    .mutation(async ({ input: { accessToken, latitude, longitude }, ctx }) => {
      const [{ queue }, { item }] = await Promise.all([
        getUsersQueue({ accessToken }),
        getPlayback({ accessToken }),
      ]);
      const queueUris = queue.map((item) => item.uri);
      const queueAndPlaybackUris = item ? [...queueUris, item.uri] : queueUris;

      const nearbyListens = await ctx.db
        .select()
        .from(schema.listen)
        .orderBy(
          sql`location <-> ST_SetSRID(ST_Point(${longitude}, ${latitude}), 4326)`,
        )
        .limit(30);

      const nearbyUris = nearbyListens.map((listen) => listen.itemUri);
      const intersectionUris = queueAndPlaybackUris.filter((value) =>
        nearbyUris.includes(value),
      );

      const isAddingToQueueRequired = intersectionUris.length < 5;

      if (isAddingToQueueRequired) {
        const suggestedListens = nearbyListens.filter(
          ({ itemUri }) => !queueAndPlaybackUris.includes(itemUri),
        );
        const suggestedListen = suggestedListens.at(0);
        if (suggestedListen) {
          await addToQueue({ uri: suggestedListen.itemUri, accessToken });
          return { suggestedListen };
        }
      }
    }),
});
