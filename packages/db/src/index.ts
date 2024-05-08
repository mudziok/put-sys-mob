import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import * as auth from "./schema/auth";
import * as listen from "./schema/listen";
import * as listenReactions from "./schema/listenReactions";
import * as post from "./schema/post";
import * as radio from "./schema/radio";

export const schema = {
  ...auth,
  ...post,
  ...listen,
  ...radio,
  ...listenReactions,
};

export * from "drizzle-orm";

export { myPgTable as tableCreator } from "./schema/_table";

const client = new Client({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "mysecretpassword",
  database: "postgres",
});

await client.connect();

export const db = drizzle(client, { schema });
export type DB = typeof db;
