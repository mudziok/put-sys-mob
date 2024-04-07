import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    AUTH_SPOTIFY_CLIENT_ID: z.string().min(1),
    AUTH_SPOTIFY_CLIENT_SECRET: z.string().min(1),
    AUTH_SPOTIFY_REDIRECT_URI: z.string().min(1),
  },
  client: {},
  experimental__runtimeEnv: {},
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});
