# Al-noon-node

A full-stack e-commerce admin platform with a Node.js + Express + MongoDB backend and a React + TypeScript admin dashboard.

---

## Project structure

```
Al-noon-node/
├── server/             # Express + MongoDB backend
├── admin-dashboard/    # React + TypeScript admin UI
└── package.json        # Root scripts for build & deploy
```

---

## Quick start (local)

### Backend

```bash
cd server
npm install
npm run dev
```

API runs at `http://localhost:4000`. Set variables in `server/.env`:

```
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/al-noon-node
JWT_SECRET=replace-me
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
```

See `server/.env.example` for all options. **Run without MongoDB:** set `DEV_WITHOUT_DB=1` in `server/.env` to start when MongoDB is not available; you can log in with `admin@localhost` / `admin123`. Remove it or set to `0` once MongoDB is ready.

### Admin dashboard

```bash
cd admin-dashboard
npm install
npm run dev
```

Dashboard runs at `http://localhost:5173` and proxies API calls to the backend.

### Create admin user

From the `server` directory:

```bash
npm run seed:admin
```

Defaults: `admin@localhost` / `admin123`. Override with env or inline:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=secret ADMIN_NAME="Your Name" npm run seed:admin
```

If the user exists, they are promoted to ADMIN; otherwise a new admin is created.

| Variable         | Default           |
| ---------------- | ----------------- |
| `ADMIN_EMAIL`    | `admin@localhost` |
| `ADMIN_PASSWORD` | `admin123`        |
| `ADMIN_NAME`     | `Admin`           |

---

## Backend (Express + MongoDB)

### Features

- **Authentication:** JWT with roles (ADMIN, USER, STAFF), RBAC permissions
- **REST APIs** under `/api/*` with rate limiting
- **Zod validation** on all inputs
- **Centralized error handling** with i18n messages (en/ar)
- **Swagger/OpenAPI** docs at `/api-docs`
- **Modular folder structure** (controllers, routes, models, validators, middlewares)

### API modules

| Module | Description |
|--------|-------------|
| `/api/auth` | Sign-in, sign-up, profile, sign-out |
| `/api/users` | User CRUD, roles, departments |
| `/api/customers` | Customer list and details |
| `/api/products` | Products CRUD, media, variants |
| `/api/categories` | Category management |
| `/api/orders` | Orders list and details |
| `/api/inventory` | Stock management |
| `/api/dashboard` | Stats, low stock, orders today |
| `/api/settings` | Store settings, logo, Google Analytics |
| `/api/cities` | City/delivery areas |
| `/api/contact` | Contact form submissions |
| `/api/feedback` | Product feedback |
| `/api/reports` | Sales and analytics reports |
| `/api/ai` | AI chat assistant settings |
| `/api/translations` | i18n translations |
| `/api/shipping-methods` | Shipping methods |
| `/api/payment-methods` | Payment methods |
| `/api/roles` | RBAC roles and permissions |
| `/api/departments` | Department management |
| `/api/newsletter` | Newsletter signup |
| `/api/subscribers` | Newsletter subscribers |
| `/api/store` | Storefront public API |
| `/api` (checkout) | Checkout flow |

---

## Admin dashboard (React + TypeScript)

### Features

- **Authentication:** Admin login via backend JWT, protected routes
- **Dashboard:** Overview, stats, low stock alerts, orders today
- **Products:** Full CRUD, media (images/videos), variants, discounts
- **Categories:** Category management
- **Orders:** Order list, detail view, status updates
- **Inventory:** Stock levels, variants
- **Customers:** Customer list and detail
- **Users:** User management with roles and departments
- **Roles & Permissions:** RBAC role CRUD
- **Departments:** Department CRUD
- **Cities:** City/delivery area management
- **Shipping methods:** Shipping configuration
- **Subscribers:** Newsletter subscriber list
- **Contact:** Contact form submissions
- **Feedback:** Product feedback management
- **AI Chat history:** AI assistant chat logs
- **Reports:** Sales and analytics
- **Settings:** Store settings, home page config, content pages, AI assistant config
- **i18n:** English and Arabic (RTL support)
- **Modern UI:** Shopify-inspired design

---

## Testing

The project uses **Vitest** for unit and integration tests, and **Cypress** for end-to-end tests.

### Test commands

| Command | Description |
|--------|-------------|
| `npm run test` | Run all unit tests (server + admin) |
| `npm run test:server` | Backend unit & API tests |
| `npm run test:admin` | Frontend unit tests |
| `npm run test:e2e` | Cypress E2E tests (headless) |
| `npm run test:e2e:open` | Cypress interactive runner |
| `npm run test:coverage` | Run with coverage (in each package) |

### Backend testing (server)

- **Vitest** + **Supertest** for API tests
- Unit tests: validators (Zod schemas), utils (response, etc.)
- API tests: health endpoint, auth validation

```bash
cd server
npm install
npm run test
npm run test:coverage   # Coverage report in coverage/
```

### Frontend testing (admin-dashboard)

- **Vitest** + **React Testing Library** + **jsdom**
- Unit tests: utils (format, api helpers), components

```bash
cd admin-dashboard
npm install
npm run test
npm run test:coverage
```

### End-to-end testing (Cypress)

- **Cypress** for full user flows (login, dashboard navigation)
- Requires **backend** and **admin dashboard** running

```bash
# Terminal 1: start backend
cd server && npm run dev

# Terminal 2: start admin
cd admin-dashboard && npm run dev

# Terminal 3: run E2E tests
cd admin-dashboard && npm run test:e2e
# Or open Cypress UI:
npm run test:e2e:open
```

E2E specs: `admin-dashboard/cypress/e2e/*.cy.ts`

---

## Production build

From the **repo root**:

```bash
npm run build
npm start
```

This builds the admin UI and server, then starts the server. API and dashboard are served from one process. Ensure `admin-dashboard/dist` exists from the build.

From each folder:

```bash
cd admin-dashboard && npm install && npm run build
cd ../server && npm install && npm run build && npm start
```

The server serves the React build from `admin-dashboard/dist` and the API under `/api/*`.

---

## Deploying

One service can serve both the API and the admin UI.

**GitHub Pages:** Hosts **static files only** (HTML/CSS/JS). It does **not** run Node.js. You can put the built React app there only if the backend is hosted elsewhere, and you’d set `VITE_API_URL` to your API URL when building. For a free full-stack demo, use **Render.com** below (one free Node service for API + frontend).

### 1. Push to GitHub

Have the project in a GitHub (or GitLab) repository.

### 2. MongoDB for production

Create a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster and get a connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/al-noon-node`). Use it as `MONGO_URI` when deploying.

### Deploy on Render.com (free, no credit card)

The repo includes `render.yaml`, so Render can build and run the whole app (Node API + React UI) as one free web service.

1. Go to [render.com](https://render.com) and sign up (GitHub login is fine).
2. **New → Blueprint** and connect your GitHub repo. Render will detect `render.yaml`.
3. **Environment** (or in the dashboard for the new service):
   - `MONGO_URI`: your MongoDB Atlas connection string (required).
   - `JWT_SECRET`: a long random string (e.g. from `openssl rand -hex 32`).
   - `CLIENT_URL`: after first deploy, set this to your Render URL (e.g. `https://al-noon-dashboard.onrender.com`) so CORS and cookies work.
4. Deploy. Build runs `npm run build`, start runs `npm start`. The app will be at the URL Render gives you (e.g. `https://al-noon-dashboard.onrender.com`).
5. **Create admin user:** from your machine with the same `MONGO_URI`, run:
   ```bash
   cd server
   ADMIN_EMAIL=your@email.com ADMIN_PASSWORD=your-password npm run seed:admin
   ```

**Note:** On the free tier the service may sleep after inactivity; the first request can take 30–60 seconds to wake up.

### Deploy on Fly.io (free; trial / limits may apply)

1. **Install Fly CLI:** [https://fly.io/docs/hands-on/install-flyctl/](https://fly.io/docs/hands-on/install-flyctl/)  
   (Windows: `powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"`)

2. **Sign up and log in:**

   ```bash
   fly auth signup
   ```

   or `fly auth login` if you already have an account.

3. **From the project root, launch the app** (first time only):

   ```bash
   fly launch --no-deploy
   ```

   Use an app name like `al-noon-dashboard`, choose a region. Do **not** add Postgres or Redis (you use MongoDB Atlas).

4. **Set secrets:**

   ```bash
   fly secrets set MONGO_URI="mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/al-noon-node?appName=Cluster0"
   fly secrets set JWT_SECRET="your-long-random-string"
   ```

   Use your real Atlas URI and a long random string for `JWT_SECRET` (e.g. `openssl rand -hex 32`).

5. **Deploy:**

   ```bash
   fly deploy
   ```

6. **Open the app:** Fly prints the URL (e.g. `https://al-noon-dashboard.fly.dev`). Log in with your admin user (run `npm run seed:admin` in `server/` against the same DB if needed).

**Note:** On the free tier the app may sleep when idle; the first request can take a few seconds.

### After first deploy: create admin user

From your machine (same `MONGO_URI` or one-off script):

```bash
cd server
ADMIN_EMAIL=your@email.com ADMIN_PASSWORD=your-secure-password npm run seed:admin
```

Or use defaults (`admin@localhost` / `admin123`) if you seeded locally against the same database.

### Environment variables (production)

| Variable         | Required | Description                                      |
| ---------------- | -------- | ------------------------------------------------ |
| `PORT`           | No       | Server port (host usually sets this).            |
| `MONGO_URI`      | Yes      | MongoDB connection string (e.g. Atlas).          |
| `JWT_SECRET`     | Yes      | Secret for JWT signing.                          |
| `CLIENT_URL`     | No       | CORS origin; set if frontend is on another host. |
| `JWT_EXPIRES_IN` | No       | Default `1d`.                                    |

### Deploying elsewhere (Railway, etc.)

From the repo root:

- **Build:** `npm run build`
- **Start:** `npm start`

Set `PORT`, `MONGO_URI`, `JWT_SECRET`, and optionally `CLIENT_URL` on your host.

### Frontend and backend on different hosts

If you host the frontend separately (e.g. Vercel/Netlify):

1. Build the admin dashboard with the API base URL:  
   `VITE_API_URL=https://your-api.example.com/api npm run build` (in `admin-dashboard/`).
2. Deploy the static site to Vercel/Netlify.
3. Deploy the server and set **CLIENT_URL** to your frontend URL (e.g. `https://your-dashboard.vercel.app`).
