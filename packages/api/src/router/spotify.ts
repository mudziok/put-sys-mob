import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "../../env";
import { createTRPCRouter, publicProcedure } from "../trpc";

const client_id = env.AUTH_SPOTIFY_CLIENT_ID;
const client_secret = env.AUTH_SPOTIFY_CLIENT_SECRET;
const redirect_uri = env.AUTH_SPOTIFY_REDIRECT_URI;

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
          message: "An unexpected error occurred, please try again later.",
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

      const trackSchema = z.object({
        item: z.object({
          album: z.object({
            images: z.array(z.object({ url: z.string() })),
          }),
          name: z.string(),
          artists: z.array(z.object({ name: z.string() })),
        }),
      });

      return trackSchema.parse(await res.json());
    }),
});