/* Reset the database to sample opportunities. Run: npm run seed */
import { ensureSchema, reset } from "./db.js";
await ensureSchema();
const n = await reset();
console.log(`Database reset — inserted ${n} sample opportunities.`);
process.exit(0);
