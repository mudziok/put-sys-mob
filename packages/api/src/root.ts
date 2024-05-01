import { authRouter } from "./router/auth";
import { listenRouter } from "./router/listen";
import { postRouter } from "./router/post";
import { radioRouter } from "./router/radio";
import { spotifyRouter } from "./router/spotify";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  post: postRouter,
  listen: listenRouter,
  spotify: spotifyRouter,
  radio: radioRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
