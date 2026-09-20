import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { prepareDatabase } from "./bootstrap";
import * as schema from "./schema";

export async function getDb() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  try {
    await prepareDatabase(env.DB);
  } catch (error) {
    console.error("ReTray database initialization failed", error);
    throw error;
  }
  return drizzle(env.DB, { schema });
}
