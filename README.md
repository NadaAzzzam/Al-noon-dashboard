# Al-noon-node

A full-stack e-commerce admin platform with a Node.js + Express + MongoDB backend and a React + TypeScript admin dashboard.

## Project structure

```
Al-noon-node/
├── server/             # Express + MongoDB backend
├── admin-dashboard/    # React + TypeScript admin UI
├── package.json        # Root scripts for build & deploy
└── render.yaml         # Render.com one-click deploy config
```

---

## Deploying (Backend + Frontend)

The app is set up so **one service** serves both the API and the admin UI. Recommended: **Render.com** (free tier).

### 1. Push your repo to GitHub

Ensure the project is in a GitHub (or GitLab) repository.

### 2. MongoDB for production

Create a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster and get a connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/al-noon-node`). You will use it as `MONGO_URI` in the next step.

### 3. Deploy on Render (one-click)

1. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
2. Connect your GitHub/GitLab repo and select the repo that contains this project.
3. Render will read `render.yaml` and create a **Web Service** named `al-noon-dashboard`.
4. In the service **Environment** tab, set:
   - **MONGO_URI** – your MongoDB Atlas connection string (required for production).
   - **CLIENT_URL** – optional; if not set, Render’s URL is used automatically.
5. Deploy. The build runs `npm run build` (builds admin UI then server), then `npm start` (runs the server). The app will be at `https://<your-service>.onrender.com`.

**Note:** On the free tier, the service may spin down after inactivity; the first request after that can be slow.

### 4. After first deploy: create admin user

From your machine (with the same `MONGO_URI` or from a one-off script), run the admin seed so you can log in:

```bash
cd server
# Set MONGO_URI to your Atlas URI (e.g. in .env)
ADMIN_EMAIL=your@email.com ADMIN_PASSWORD=your-secure-password npm run seed:admin
```

Or use the defaults (admin@localhost / admin123) if you ran the seed locally against the same database.

### Environment variables (production)

| Variable       | Required | Description |
|----------------|----------|-------------|
| `PORT`         | Set by Render | Server port. |
| `MONGO_URI`    | Yes (for DB) | MongoDB connection string (e.g. Atlas). |
| `JWT_SECRET`   | Yes | Secret for JWT signing (Render can generate). |
| `CLIENT_URL`   | No | CORS origin; defaults to Render URL if not set. |
| `JWT_EXPIRES_IN` | No | Default `1d`. |

See `server/.env.example` for local development. Copy it to `server/.env` and fill in values.

### Deploying elsewhere (Railway, Fly.io, etc.)

From the repo root:

- **Build:** `npm run build` (installs and builds both `admin-dashboard` and `server`).
- **Start:** `npm start` (runs `server`; ensure `admin-dashboard/dist` exists from the build).

Set `PORT`, `MONGO_URI`, `JWT_SECRET`, and optionally `CLIENT_URL` in your host’s environment.

### Frontend and backend on different hosts (optional)

If you host the frontend separately (e.g. Vercel/Netlify):

1. Build the admin dashboard with the API base URL:  
   `VITE_API_URL=https://your-api.onrender.com/api npm run build` (in `admin-dashboard/`).
2. Deploy the built static site to Vercel/Netlify.
3. Deploy the server (e.g. Render) and set **CLIENT_URL** to your frontend URL (e.g. `https://your-dashboard.vercel.app`).

---

## Backend (Express + MongoDB)

### Features
- JWT authentication with roles (ADMIN, USER)
- REST APIs under `/api/*`
- Zod validation
- Centralized error handling
- Modular, scalable folder structure

### Running the backend

```bash
cd server
npm install
npm run dev
```

The API runs at `http://localhost:4000` and exposes the following modules:
- `/api/auth`
- `/api/users`
- `/api/products`
- `/api/categories`
- `/api/orders`

Set environment variables in `server/.env` as needed:

```
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/al-noon-node
JWT_SECRET=replace-me
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
```

**Run without MongoDB:** Set `DEV_WITHOUT_DB=1` in `server/.env` to start the server when MongoDB is not installed or not running. You can log in with `admin@localhost` / `admin123`; products, orders, and users will show as empty until the database is connected. Remove `DEV_WITHOUT_DB` or set it to `0` once MongoDB is ready.

### Admin seeding

Create or promote an admin account locally without editing the database by hand. From the `server` directory run:

```bash
npm run seed:admin
```

Defaults used if not overridden by environment variables:

| Variable         | Default          |
|------------------|------------------|
| `ADMIN_EMAIL`    | `admin@localhost` |
| `ADMIN_PASSWORD` | `admin123`       |
| `ADMIN_NAME`     | `Admin`          |

To use custom credentials, set them in `server/.env` or pass them when running the script, for example:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=secret ADMIN_NAME="Your Name" npm run seed:admin
```

- If a user with the given email already exists, they are promoted to `ADMIN` (and name/password are updated if provided).
- If no user exists, a new admin user is created with the given email, password, and name.

## Admin dashboard (React + TypeScript)

### Features
- Admin login using backend JWT
- Products CRUD connected to backend APIs
- Orders management
- Users list
- Dashboard analytics
- Modern, Shopify-inspired UI

### Running the dashboard

```bash
cd admin-dashboard
npm install
npm run dev
```

The admin UI runs at `http://localhost:5173` and proxies API calls to the backend.

## Production build (local or single-server deploy)

From the **repo root** (recommended):

```bash
npm run build
npm start
```

This builds the admin UI and server, then starts the server. The API and dashboard are served from one process.

Alternatively, from each folder:

```bash
cd admin-dashboard && npm install && npm run build
cd ../server && npm install && npm run build && npm start
```

The server serves the React build from `admin-dashboard/dist` and the API under `/api/*`. For deployment to Render or other hosts, see **Deploying** above.
