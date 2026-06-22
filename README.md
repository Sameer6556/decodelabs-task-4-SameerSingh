# GiveTime — Project 4: Frontend + Backend Integration

Week 4, the capstone. The responsive **GiveTime frontend** now talks to the
**MySQL-backed REST API** over the network with `fetch` + `async/await`. One
command runs the whole thing.

## Prerequisites

A running **MySQL** server (same as Project 3). Defaults: host `127.0.0.1`,
port `3306`, user `root`, empty password, database `givetime` — override with
`DB_*` env vars or a `.env` (see `.env.example`). The app creates the schema and
seeds sample data on first run.

## Run it

```bash
npm install      # express + cors + mysql2
npm start        # http://localhost:4200
```

Open **http://localhost:4200** — the page loads its data live from the API.

```bash
npm test         # full-stack contract test (uses a separate givetime_test db)
npm run seed     # reset the database to sample opportunities
```

## What to try in the browser

1. **Loads from the database** — cards appear after a live `GET`; watch the skeleton
   loader and the "API online" pill in the header.
2. **Sign up** for an opportunity → `POST /:id/signup`; the bar and count update. A
   full one shows "Filled" (the server returns `409`).
3. **Post** an opportunity → `POST`; **edit** (pencil) → `PUT`; **delete** (trash) →
   `DELETE` with a confirm dialog.
4. **Search / filter by cause** → the UI calls the API with `?search=` / `?cause=`.
5. **Defensive behaviour** — stop the server (Ctrl+C) and hit **Retry**: you get a
   clear error banner, not a blank page. Restart and it recovers.
6. **Persistence** — everything survives a restart; it's in MySQL.

## Project 4 concepts → where they live

| Concept | Implementation |
|---|---|
| Request → process → response → DOM | `fetch` (`public/js/api.js`) → Express route → MySQL → JSON → `render()` (`public/js/app.js`) |
| REST + correct verbs | `GET / POST / PUT / PATCH / DELETE` + `POST /:id/signup` in `src/opportunities.routes.js` |
| async / await over fetch | every call in `public/js/api.js` is awaited |
| HTTP status codes drive logic | `response.ok` / `status` checked in `api.js`; 200/201/400/404/409 |
| JSON parse / serialize | `JSON.stringify` out, `res.json()` in |
| CORS bridge | `cors()` middleware in `server.js` |
| Dynamic DOM injection (XSS-safe) | `card()` uses `createElement` + `textContent`, not `innerHTML`, for data |
| Defensive programming | `load()` / `onSubmit()`: loading state, try/catch/finally, error banner, toasts |

## Architecture

```
Browser (public/)                    Server (Node + Express)        Storage
┌──────────────────┐   fetch/JSON   ┌───────────────────────┐    ┌─────────┐
│ index.html       │ ─────────────▶ │ /api/opportunities    │ ─▶ │ MySQL   │
│ js/api.js  ──────┼── async/await ─│ cors + express.json   │    │ givetime│
│ js/app.js  (DOM) │ ◀───────────── │ static files (public/)│ ◀─ │   .db   │
└──────────────────┘  200/4xx/5xx   └───────────────────────┘    └─────────┘
```

## Files

```
project-4-fullstack-integration/
├── server.js                       # API + CORS + serves the frontend
├── schema.sql                      # reference DDL
├── .env.example
├── src/
│   ├── config.js                   # DB settings from env
│   ├── db.js                       # MySQL pool, schema, seed, CRUD + sign-up
│   ├── validate.js
│   ├── opportunities.routes.js
│   └── seed.js
├── public/
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── api.js                  # fetch/async-await client + error handling
│       └── app.js                  # rendering, CRUD, sign-up, states, toasts
├── test/smoke-test.js
└── package.json
```
