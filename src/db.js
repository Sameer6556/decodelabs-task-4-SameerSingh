/* ===========================================================
   MySQL data layer (Project 4), same engine as Project 3.
   Pool, schema, seed, CRUD + atomic sign-up. event_date is
   aliased to `date` in reads to match the frontend's shape.
   =========================================================== */
import mysql from "mysql2/promise";
import { dbConfig } from "./config.js";

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
});

export async function ensureSchema() {
  const boot = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    ssl: dbConfig.ssl,
  });
  try {
    await boot.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`
         CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } catch (e) {
    // Some managed databases are pre-created and disallow CREATE DATABASE.
    // That is fine: the table is created in the existing database below.
  }
  await boot.end();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      title        VARCHAR(160) NOT NULL,
      organization VARCHAR(160) NOT NULL,
      cause        VARCHAR(40)  NOT NULL,
      location     VARCHAR(160) NOT NULL,
      event_date   DATE         NOT NULL,
      slots        INT          NOT NULL,
      filled       INT          NOT NULL DEFAULT 0,
      created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
}

const SELECT =
  "SELECT id, title, organization, cause, location, event_date AS date, slots, filled FROM opportunities";

const SEED = [
  ["Gomti riverfront cleanup", "Swachh Gomti Abhiyan", "Environment", "Gomti Riverfront, Lucknow", "2026-07-05", 30, 18],
  ["Evening English class for kids", "Aasra Foundation", "Education", "Aishbagh, Lucknow", "2026-07-08", 8, 5],
  ["Blood donation camp helpers", "Indian Red Cross, Lucknow", "Health", "Hazratganj, Lucknow", "2026-07-12", 15, 15],
  ["Tree plantation drive", "Green Lucknow Collective", "Environment", "Janeshwar Mishra Park", "2026-07-13", 50, 22],
  ["Cook & serve for the homeless", "Roti Bank Lucknow", "Community", "Charbagh, Lucknow", "2026-07-15", 12, 7],
  ["Stray dog feeding & care", "Lucknow Animal Rescue", "Animal Welfare", "Indira Nagar, Lucknow", "2026-07-18", 10, 4],
];

export async function seedIfEmpty() {
  const [[{ c }]] = await pool.query("SELECT COUNT(*) AS c FROM opportunities");
  if (c > 0) return 0;
  await pool.query(
    "INSERT INTO opportunities (title, organization, cause, location, event_date, slots, filled) VALUES ?",
    [SEED]
  );
  return SEED.length;
}

export async function reset() {
  await pool.query("DELETE FROM opportunities");
  await pool.query("ALTER TABLE opportunities AUTO_INCREMENT = 1");
  return seedIfEmpty();
}

export const opportunitiesDb = {
  async list({ cause, search } = {}) {
    const where = [];
    const params = [];
    if (cause && cause !== "all") {
      where.push("cause = ?");
      params.push(cause);
    }
    if (search) {
      where.push("(LOWER(title) LIKE ? OR LOWER(organization) LIKE ? OR LOWER(location) LIKE ?)");
      const like = `%${search.toLowerCase()}%`;
      params.push(like, like, like);
    }
    const sql =
      SELECT + (where.length ? " WHERE " + where.join(" AND ") : "") + " ORDER BY event_date ASC, id ASC";
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  async find(id) {
    const [rows] = await pool.execute(SELECT + " WHERE id = ?", [Number(id)]);
    return rows[0] || null;
  },

  async create(d) {
    const [r] = await pool.execute(
      "INSERT INTO opportunities (title, organization, cause, location, event_date, slots, filled) VALUES (?, ?, ?, ?, ?, ?, 0)",
      [d.title.trim(), d.organization.trim(), d.cause, d.location.trim(), d.date, Number(d.slots)]
    );
    return this.find(r.insertId);
  },

  async update(id, d) {
    const cur = await this.find(id);
    if (!cur) return null;
    const m = {
      title: d.title ?? cur.title,
      organization: d.organization ?? cur.organization,
      cause: d.cause ?? cur.cause,
      location: d.location ?? cur.location,
      date: d.date ?? cur.date,
      slots: d.slots ?? cur.slots,
    };
    await pool.execute(
      "UPDATE opportunities SET title=?, organization=?, cause=?, location=?, event_date=?, slots=? WHERE id=?",
      [m.title.trim(), m.organization.trim(), m.cause, m.location.trim(), m.date, Number(m.slots), Number(id)]
    );
    return this.find(id);
  },

  async remove(id) {
    const [r] = await pool.execute("DELETE FROM opportunities WHERE id = ?", [Number(id)]);
    return r.affectedRows > 0;
  },

  async signUp(id) {
    const [r] = await pool.execute(
      "UPDATE opportunities SET filled = filled + 1 WHERE id = ? AND filled < slots",
      [Number(id)]
    );
    const row = await this.find(id);
    if (!row) return { status: "notfound" };
    if (r.affectedRows === 0) return { status: "full", row };
    return { status: "ok", row };
  },
};

export default pool;
