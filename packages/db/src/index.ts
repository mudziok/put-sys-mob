import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import * as auth from "./schema/auth";
import * as listen from "./schema/listen";
import * as post from "./schema/post";

export const schema = { ...auth, ...post, ...listen };

export * from "drizzle-orm";

export { mySqlTable as tableCreator } from "./schema/_table";

const client = new Client({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "mysecretpassword",
  database: "postgres",
});

await client.connect();

export const db = drizzle(client, { schema });
