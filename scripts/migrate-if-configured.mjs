if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL is absent; skipping local schema migration.");
} else {
  await import("./migrate.mjs");
}
