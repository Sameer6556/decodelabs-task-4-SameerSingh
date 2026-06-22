/* ===========================================================
   Full-stack smoke test (Project 4). Verifies the API contract
   the frontend relies on, that the frontend is served, and that
   CORS is enabled. Uses a separate "givetime_test" database.
   Requires a running MySQL server.  Run with:  npm test
   =========================================================== */
process.env.NODE_ENV = "test";
process.env.DB_NAME = process.env.DB_NAME_TEST || "givetime_test";

const { reset } = await import("../src/db.js");
const { default: app } = await import("../server.js");

let passed = 0, failed = 0;
const check = (label, cond) => {
  if (cond) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}`); }
};

await reset();
const server = app.listen(0);
await new Promise((r) => server.once("listening", r));
const base = `http://localhost:${server.address().port}`;
const json = (m, p, b) =>
  fetch(base + p, { method: m, headers: b ? { "Content-Type": "application/json" } : undefined, body: b ? JSON.stringify(b) : undefined });

try {
  check("GET /api/health → 200", (await json("GET", "/api/health")).status === 200);

  let res = await json("GET", "/api/opportunities");
  let body = await res.json();
  check("list seeded → 200 with 6", res.status === 200 && body.count === 6);
  check("CORS header present", res.headers.get("access-control-allow-origin") === "*");

  res = await json("GET", "/");
  const html = await res.text();
  check("frontend served at /", res.status === 200 && html.includes("GiveTime"));

  res = await json("POST", "/api/opportunities", {
    title: "Park bench painting", organization: "City Volunteers", cause: "Community",
    location: "Lalbagh, Lucknow", date: "2026-08-01", slots: 10,
  });
  body = await res.json();
  const id = body.data?.id;
  check("CREATE → 201", res.status === 201 && id);

  check("PUT → 200", (await json("PUT", `/api/opportunities/${id}`, {
    title: "Park bench painting", organization: "City Volunteers", cause: "Community",
    location: "Lalbagh, Lucknow", date: "2026-08-02", slots: 12,
  })).status === 200);

  res = await json("POST", `/api/opportunities/1/signup`);
  body = await res.json();
  check("SIGN UP → 200 filled +1", res.status === 200 && body.data.filled === 19);

  check("SIGN UP full (seed 3) → 409", (await json("POST", `/api/opportunities/3/signup`)).status === 409);

  check("DELETE → 200", (await json("DELETE", `/api/opportunities/${id}`)).status === 200);
  check("GET deleted → 404", (await json("GET", `/api/opportunities/${id}`)).status === 404);
  check("invalid → 400", (await json("POST", "/api/opportunities", { title: "x" })).status === 400);
} finally {
  server.closeAllConnections?.();
  await new Promise((r) => server.close(r));
}

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
