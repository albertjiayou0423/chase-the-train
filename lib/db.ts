import "server-only";
import { neon } from "@neondatabase/serverless";

export function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

export function databaseReady() {
  return Boolean(process.env.DATABASE_URL);
}
