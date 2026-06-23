/* Database connection settings (override via DB_* env vars).
   Locally: host 127.0.0.1, user root, empty password (no SSL).
   Cloud MySQL (TiDB Cloud, Aiven, etc.): set DB_HOST/DB_PORT/
   DB_USER/DB_PASSWORD/DB_NAME from the provider, and DB_SSL=true
   (cloud databases require an encrypted connection). */
export const dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME || "givetime",
  ssl: process.env.DB_SSL === "true" ? { minVersion: "TLSv1.2" } : undefined,
};
