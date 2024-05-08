import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "../../env";
import { createTRPCRouter, publicProcedure } from "../trpc";

const client_id = env.AUTH_SPOTIFY_CLIENT_ID;
const client_secret = env.AUTH_SPOTIFY_CLIENT_SECRET;
const redirect_uri = env.AUTH_SPOTIFY_REDIRECT_URI;

const contextSchema = z.object({
  uri: z.string(),
});

const itemSchema = z.object({
  album: z.object({
    images: z.array(z.object({ url: z.string() })),
  }),
  name: z.string(),
  artists: z.array(z.object({ name: z.string() })),
  uri: z.string(),
});

const playbackSchema = z.object({
  context: contextSchema.nullable(),
  item: itemSchema.nullable(),
});

// TODO: Wrap this function with some sort of caching mechanism
export const getUserProfile = async ({
  accessToken,
}: {
  accessToken: string;
}) => {
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
};

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

      const { context, item } = playbackSchema.parse(await res.json());

      if (!context || !item) {
        return { isPlaying: false as const };
      }

      return { context, item, isPlaying: true as const };
    }),
  // TODO: Check if this works with a Spotify Premium account, please delete this comment if it does
  play: publicProcedure
    .input(
      z.object({
        accessToken: z.string().optional(),
        contextUri: z.string(),
        itemUri: z.string(),
      }),
    )
    .mutation(async ({ input: { accessToken, contextUri, itemUri } }) => {
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
});
