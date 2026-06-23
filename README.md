# GiveTime, Project 4: Frontend and Backend Integration

Week 4, the full version. The multi page **GiveTime** site is served by a Node and
Express server and talks to a **MySQL** database through a REST API, using `fetch`.
One command runs the whole thing.

## Prerequisites

A running **MySQL** server (same as Project 3). Defaults: host `127.0.0.1`,
port `3306`, user `root`, empty password, database `givetime`. Override with
`DB_*` env vars or a `.env` file (see `.env.example`). The app creates the schema
and seeds sample data on first run.

## Run it

```bash
npm install      # express + cors + mysql2
npm start        # http://localhost:4200
```

Open http://localhost:4200.

```bash
npm test         # full stack test (uses a separate givetime_test database)
npm run seed     # reset the database to sample opportunities
```

## Pages (all served by Express, all wired to the API)

| Page | File | Talks to the API for |
|---|---|---|
| Home | `index.html` | summary numbers (`GET`) and the connection status |
| Opportunities | `opportunities.html` | list, search, filter, sign up, delete |
| Post / Edit | `post.html` | create (`POST`), or edit when opened as `post.html?id=NN` (`PUT`) |
| About | `about.html` | static |

## What to try in the browser

1. **Loads from the database** on the Opportunities page (watch the skeleton loader and
   the "API online" pill in the header).
2. **Sign up** for one. The bar and count update and the change is saved in MySQL.
   Each browser can sign up for a given opportunity once (then it shows "Signed up");
   a full one shows "Filled" (the server returns `409`).
3. **Post** a new opportunity. Only opportunities you posted from this browser show
   **edit** (pencil) and **delete** (trash) controls, so visitors cannot change other
   people's posts. (Without login this is scoped per browser; with accounts it would
   become a real owner check.)
4. **Search and filter by cause**. The page calls the API with `?search=` and `?cause=`.
5. **Defensive behaviour**: stop the server, then hit Retry on the Opportunities page.
   You get a clear message, not a blank screen. Restart and it recovers.

## How the concepts map

| Concept | Where |
|---|---|
| Request, process, response, render | `fetch` in `public/js/api.js`, Express route, MySQL, JSON back, DOM update |
| REST and correct verbs | `GET / POST / PUT / PATCH / DELETE` plus `POST /:id/signup` in `src/opportunities.routes.js` |
| async / await over fetch | every call in `public/js/api.js` |
| HTTP status codes drive logic | `response.ok` and `status` checked in `api.js`; 200 / 201 / 400 / 404 / 409 |
| JSON in and out | `JSON.stringify` on send, `res.json()` on receive |
| CORS | `cors()` in `server.js` |
| Safe DOM rendering | cards built with `createElement` and `textContent`, not `innerHTML` |
| Defensive programming | loading, error banner, retry and toasts in the page scripts |

## Files

```
project-4-fullstack-integration/
├── server.js                       API + CORS + serves public/
├── schema.sql                      reference DDL
├── .env.example
├── src/
│   ├── config.js                   DB settings from env
│   ├── db.js                       MySQL pool, schema, seed, CRUD + sign-up
│   ├── validate.js
│   ├── opportunities.routes.js
│   └── seed.js
├── public/
│   ├── index.html                  Home
│   ├── opportunities.html          Browse + sign up + delete
│   ├── post.html                   Create / edit
│   ├── about.html
│   ├── css/styles.css
│   └── js/
│       ├── api.js                  fetch client
│       ├── nav.js                  menu + connection pill
│       ├── home.js                 summary numbers
│       ├── opportunities.js        list, sign up, delete, search, filter
│       └── post.js                 create + edit
├── test/smoke-test.js
└── package.json
```
