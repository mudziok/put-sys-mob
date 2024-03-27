import { authRouter } from "./router/auth";
import { listenRouter } from "./router/listen";
import { postRouter } from "./router/post";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  post: postRouter,
  listen: listenRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
