/* ===========================================================
   GiveTime Full-Stack — Project 4
   One server that:
     1. serves the responsive frontend (public/), and
     2. exposes the MySQL-backed REST API (/api/opportunities).
   The browser talks to the API with fetch/async-await. CORS is
   enabled so the frontend works from here or a separate origin.
   =========================================================== */
import express from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ensureSchema, seedIfEmpty } from "./src/db.js";
import opportunitiesRouter from "./src/opportunities.routes.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4200;

app.use(cors());
app.use(express.json());
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.url}`);
  next();
});

// API
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "givetime-fullstack", storage: "mysql" });
});
app.use("/api/opportunities", opportunitiesRouter);

// Frontend (static)
app.use(express.static(join(__dirname, "public")));

// API 404 stays JSON; everything else falls back to the page.
app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
  }
  res.status(404).sendFile(join(__dirname, "public", "index.html"));
});

app.use((err, _req, res, _next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Request body is not valid JSON." });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

try {
  await ensureSchema();
} catch (e) {
  console.error("\n  Could not connect to MySQL. Is the server running, and are");
  console.error("  the DB_* settings correct? (see src/config.js)");
  console.error("  " + e.message + "\n");
  process.exit(1);
}

if (process.env.NODE_ENV !== "test") {
  await seedIfEmpty();
  app.listen(PORT, () => {
    console.log(`\n  GiveTime Full-Stack running →  http://localhost:${PORT}`);
    console.log(`  Open that URL in your browser.\n`);
  });
}

export default app;
