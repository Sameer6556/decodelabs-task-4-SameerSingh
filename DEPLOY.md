# Deploying GiveTime so others can use it

Goal: a public link anyone can open, with an always-on database, so you never
start anything on your own machine. Two free accounts are needed: one for the
database (TiDB Cloud) and one for the app host (Render). The code already supports
this; you only set connection values, nothing to rewrite.

Rough time: 20 to 30 minutes.

---

## Part A. Free cloud MySQL (TiDB Cloud Serverless)

TiDB Cloud Serverless speaks the MySQL protocol, so the existing `mysql2` code
works unchanged. The free tier is always on and does not expire.

1. Go to https://tidbcloud.com and sign up (Google or GitHub is quickest).
2. A free **Serverless** cluster is created for you (if not, click **Create Cluster**
   and pick the free Serverless option).
3. Open the cluster and click **Connect**.
   - If asked, set a **password** and save it somewhere.
   - Choose connection type "General" / "Connect with a MySQL client".
4. Note these five values from the panel:
   - **Host** (looks like `gateway01.<region>.prod.aws.tidbcloud.com`)
   - **Port** (`4000`, not 3306)
   - **User** (looks like `xxxxxxxx.root`)
   - **Password** (the one you set)
   - **Database** (use `givetime`; the app creates it on first run)

That is all you need from TiDB. You do not have to create tables by hand; the app
runs `CREATE TABLE IF NOT EXISTS` on startup.

### Quick check from your machine (optional but recommended)

Create a file `project-4-fullstack-integration/.env` with your values:

```
DB_HOST=gateway01.<region>.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=xxxxxxxx.root
DB_PASSWORD=your_password
DB_NAME=givetime
DB_SSL=true
```

Then run `npm start` and open http://localhost:4200. If the opportunities load,
your cloud database works. (`.env` is git-ignored, so it will not be uploaded.)

---

## Part B. Put the app on GitHub

Render deploys from a Git repository.

1. Create a GitHub account if you do not have one: https://github.com
2. Make a new empty repository (for example `givetime`).
3. Push the **project-4 folder** to it. Ask me and I will run the `git init`,
   commit and push for you, or use GitHub Desktop.
   - `node_modules` and `.env` are already in `.gitignore`, so secrets stay out.

> Simplest layout: push the contents of `project-4-fullstack-integration` as the
> repo root. Then Render needs no "root directory" setting.

---

## Part C. Deploy the app on Render (free)

1. Go to https://render.com and sign up with GitHub.
2. **New > Web Service**, then pick your `givetime` repository.
3. Settings:
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
   - **Root Directory**: leave blank if the repo root is the project-4 folder;
     otherwise set it to `project-4-fullstack-integration`.
4. Add **Environment Variables** (from Part A), exactly these keys:

   | Key | Value |
   |---|---|
   | `DB_HOST` | your TiDB host |
   | `DB_PORT` | `4000` |
   | `DB_USER` | your TiDB user |
   | `DB_PASSWORD` | your TiDB password |
   | `DB_NAME` | `givetime` |
   | `DB_SSL` | `true` |

5. Click **Create Web Service**. Render installs and starts it, then gives you a
   public URL like `https://givetime.onrender.com`.
6. Open the URL. On first load the database is created and seeded automatically.

That link works for anyone, with nothing running on your computer.

---

## Things to know about free tiers

- Free Render web services **sleep after about 15 minutes** of no traffic. The next
  visit wakes it, which can take ~30 seconds. After that it is fast again.
- The app creates the schema and seeds sample data the first time it connects.
- To reset the data later: set the same env values locally and run `npm run seed`,
  or use Render's shell.

## How the code already supports this

- Server port comes from `process.env.PORT` (Render sets this).
- All database settings come from `DB_*` env variables (`src/config.js`).
- `DB_SSL=true` turns on the encrypted connection cloud databases require.
- Nothing about the app logic changes between local and cloud; only the values do.
