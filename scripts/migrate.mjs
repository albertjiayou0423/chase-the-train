import { readFile, readdir } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required; no migration was run.");
  process.exit(1);
}

const sql = neon(url);
const directory = new URL("../db/", import.meta.url);
const files = (await readdir(directory)).filter((name) => /^\d+_.*\.sql$/.test(name)).sort();
for (const name of files) {
  const migration = await readFile(new URL(name, directory), "utf8");
  const statements = migration.split(";").map((part) => part.trim()).filter(Boolean);
  for (const statement of statements) await sql.query(statement);
  console.log(`Applied ${name} (${statements.length} idempotent statements).`);
}
