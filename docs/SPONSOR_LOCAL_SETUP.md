# KimuntuX — Local development setup (sponsor / handoff)

This guide walks through running the **React frontend** and **FastAPI backend** on a Windows machine against **AWS RDS (PostgreSQL)**. Follow the sections in order the first time; after that, use the **Quick start** at the bottom for daily work.

---

## 1. What you need installed

| Tool | Purpose |
|------|---------|
| **Node.js** (LTS) + **npm** | Frontend (`npm start`) |
| **Python 3.11+** (3.12 recommended; avoid bleeding-edge 3.14 if you hit library issues) | Backend virtualenv |
| **Git** | Clone / pull the repository |
| **Web browser** | Chrome or Edge is fine |
| **AWS account access** | RDS console, EC2 security groups, Secrets Manager (if used) |

Optional: **DBeaver** or **psql** to verify the database directly.

---

## 2. Get the code

```powershell
cd "E:\Kimuntu Capstone\kimuntu_x"
git pull
```

(Adjust the path if the project lives elsewhere.)

---

## 3. AWS — confirm the database

1. Sign in to the [AWS Console](https://console.aws.amazon.com).
2. Open **RDS** → **Databases** → select your instance (e.g. `database-1`).
3. Check **Status** = **Available**.
4. Note:
   - **Endpoint** (hostname for `DATABASE_URL`)
   - **Port** (usually **5432**)
   - **Master username** (often `postgres`)
   - **VPC security group(s)** attached to the instance (e.g. `sg-xxxxxxxx`)

**Public access:** If you connect from a laptop on the internet, the RDS instance must be **publicly accessible** (or you must use a VPN / bastion in the same VPC). If only private subnets are used, a security group IP rule alone is not enough.

---

## 4. AWS — allow your current IP (security group)

Your home/office **public IP changes** when you move networks. The security group must allow **your current IP** on **PostgreSQL (5432)**.

1. Find your **public IP** (e.g. search “what is my ip” in a browser, or run `curl -s https://ifconfig.me/ip` in PowerShell).
2. In AWS: **EC2** → **Security Groups** (or from RDS → **Connectivity & security** → click the **VPC security group** link).
3. Select the **same security group** attached to the RDS instance.
4. **Inbound rules** → **Edit inbound rules**.
5. Add or update a rule:
   - **Type:** PostgreSQL (or **Custom TCP**, port **5432**)
   - **Source:** **My IP** (AWS fills `x.x.x.x/32`) or **Custom** = `YOUR.IP.ADDRESS/32`
6. **Save rules.** Remove old home IPs if you no longer use them.

If the database is not reachable, the backend will fail at startup or on first DB use with connection errors.

---

## 5. AWS — database password

- If RDS uses **Secrets Manager** (link **View in Secrets Manager** on the RDS page), open the secret and copy the current **password** for the master user.
- If you **rotated** the master password in RDS **Modify**, update `DATABASE_URL` in `backend/.env` to match.

**Special characters in passwords** (`@`, `#`, `%`, `:`, `/`, etc.) must be **URL-encoded** inside `DATABASE_URL`, or use a temporary alphanumeric password to test.

---

## 6. Backend configuration (`backend/.env`)

1. From the `backend` folder, copy the template if you do not already have `.env`:

   ```powershell
   cd "E:\Kimuntu Capstone\kimuntu_x\backend"
   copy .env.example .env
   ```

2. Edit **`backend/.env`** (do **not** commit real secrets to Git; `backend/.env` is gitignored).

   | Variable | What to set |
   |----------|-------------|
   | `DATABASE_URL` | `postgresql+psycopg://USER:PASSWORD@RDS_ENDPOINT:5432/DATABASE_NAME` |
   | `JWT_SECRET_KEY` | Long random string; **keep the same** across restarts or all users must sign in again |
   | `CORS_ORIGINS` | Must include the exact origin you use for the UI, e.g. `http://localhost:3000`. If you open the app as `http://127.0.0.1:3000`, add that too (comma-separated). |
   | `BOOTSTRAP_ADMIN_*` | Optional overrides for the auto-created admin (defaults below). |

3. Save the file.

---

## 7. Backend — Python virtual environment and run

```powershell
cd "E:\Kimuntu Capstone\kimuntu_x\backend"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Expected log line: **`Application startup complete.`**

**Sanity checks:**

- Open: `http://127.0.0.1:8000/health` → JSON with `"status": "ok"`.
- API docs: `http://127.0.0.1:8000/docs`

**Default bootstrap admin** (unless overridden in `.env`):

- Email: `yannick@example.com`
- Password: `Capstone@123`

On each startup the backend ensures that user exists and is an administrator (see `backend/README.md`).

---

## 8. Frontend configuration (project root)

The repo uses **Create React App** with **`src/setupProxy.js`**: the browser talks to `http://localhost:3000/api/v1/...` and the dev server forwards to **`http://127.0.0.1:8000`**.

1. At the **repository root** (same folder as `package.json`), ensure **`.env`** exists with:

   ```env
   REACT_APP_API_BASE_URL=/api/v1
   ```

2. **Do not** add `"proxy"` to `package.json` for this project — it conflicts with CRA 5 and can break `npm start`. Proxying is handled in **`src/setupProxy.js`**.

3. If `npm start` ever fails with **`allowedHosts[0] should be a non-empty string`**, your environment may have an empty `HOST` variable. Either remove `HOST` from the environment or set `HOST=localhost` only if needed (avoid combining with a `package.json` proxy).

---

## 9. Frontend — install and run

```powershell
cd "E:\Kimuntu Capstone\kimuntu_x"
npm install
npm start
```

The terminal should show **Compiled successfully** and open **http://localhost:3000**.

**Important:** After changing **any** `REACT_APP_*` variable, stop the dev server (**Ctrl+C**) and run **`npm start`** again.

---

## 10. Sign in and admin

1. Open **http://localhost:3000/login** (or use **Sign in** in the header).
2. Use the bootstrap admin email/password (lowercase email is safest: `yannick@example.com`).
3. Admins are redirected to **`/admin`** for the admin dashboard (users, contact submissions, support messages). Additional admin actions (e.g. access-as-user, make admin) are documented in code and API under **`/api/v1/admin/...`**.

---

## 11. Troubleshooting checklist

| Symptom | What to check |
|---------|----------------|
| Backend will not start / DB errors | `DATABASE_URL`, RDS security group **5432** from **your current IP**, RDS **Available**, password correct / URL-encoded |
| **`Failed to fetch`** on login | Backend running? `REACT_APP_API_BASE_URL=/api/v1` in **root** `.env`? **`npm start` restarted**? Try `http://127.0.0.1:8000/health` in the browser |
| **`Could not validate credentials`** (API) | Sign out and sign in again; **`JWT_SECRET_KEY`** must not change between issuing and validating tokens |
| **`password authentication failed`** | Update password in **`backend/.env`** to match RDS / Secrets Manager |
| Frontend shows **HTML / JSON parse** errors | Read the **uvicorn** terminal for the Python traceback; fix the backend error first |

---

## 12. Quick start (after everything is configured)

**Terminal A — backend**

```powershell
cd "E:\Kimuntu Capstone\kimuntu_x\backend"
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal B — frontend**

```powershell
cd "E:\Kimuntu Capstone\kimuntu_x"
npm start
```

Then open **http://localhost:3000**.

---

## 13. Production vs local (for the sponsor)

- **`setupProxy.js` and `REACT_APP_API_BASE_URL=/api/v1` apply to `npm start` only.** A production build (`npm run build`) does **not** use that proxy; you must set **`REACT_APP_API_BASE_URL`** to the real public API URL (e.g. in **`.env.production`**) and deploy the API with HTTPS and correct **CORS** origins for the production site.

---

## 14. Repository links (fill in if public)

- **Taiga / project board:** *(your link)*
- **GitHub:** https://github.com/aryanyeole/KimuntuX *(confirm branch)*

---

*Document generated for local + AWS RDS handoff. Keep secrets in `.env` files only; never paste passwords into chat or commit them to Git.*
