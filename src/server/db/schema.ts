import { bigint, jsonb, pgTableCreator, text } from "drizzle-orm/pg-core";
import type { RoastBattleSchemaType } from "~/lib/schemas/roast-battle";

export const createTable = pgTableCreator((name) => `${name}`);

export const roastBattles = createTable("roastBattles", {
  id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
  prompt: text("prompt"),
  character1Name: text("character1_Name"),
  character2Name: text("character2_Name"),
  battleData: jsonb("hattle_data").$type<RoastBattleSchemaType>().notNull(),
});
