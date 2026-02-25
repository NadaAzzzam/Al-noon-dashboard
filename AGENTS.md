# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Al-noon-node is a full-stack e-commerce admin platform with two services:
- **Backend API** (`server/`): Node.js + Express + TypeScript, port 4000
- **Admin Dashboard** (`admin-dashboard/`): React + Vite + TypeScript, port 5173

See `README.md` for standard dev commands (`npm run dev` in each directory).

### Running services

1. **MongoDB** must be running before starting the backend. Start with:
   ```
   mongod --dbpath /data/db --logpath /var/log/mongod.log --logappend --bind_ip 127.0.0.1 &
   ```
   Ensure `/data/db` exists and is writable (`sudo mkdir -p /data/db && sudo chmod 777 /data/db`).

2. **Backend**: `cd server && npm run dev` (port 4000, uses `tsx` + `nodemon`)

3. **Admin Dashboard**: `cd admin-dashboard && npm run dev` (port 5173, Vite proxies `/api` and `/uploads` to backend)

4. **Seed admin user**: `cd server && npm run seed:admin` (creates `admin@localhost` / `admin123`)

### Non-obvious caveats

- The server `.env` file must exist before starting. Copy from `.env.example`: `cp server/.env.example server/.env`
- The auth login endpoint is `/api/auth/sign-in` (not `/api/auth/login`).
- ESLint config is missing (project uses ESLint v9 but has no `eslint.config.js`); `npm run lint` in `server/` will fail. This is a pre-existing issue.
- TypeScript strict checks produce errors in both `server/` and `admin-dashboard/` but `tsx` (used in dev) transpiles without strict checking, so the app runs fine.
- The admin dashboard Vite dev server proxies `/api` and `/uploads` to `http://localhost:4000`, so the backend must be running first.
- MongoDB `--fork` option may fail in containerized environments; use background `&` instead.
