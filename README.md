# Al-noon-node

A full-stack e-commerce admin platform with a Node.js + Express + MongoDB backend and a React + TypeScript admin dashboard.

## Project structure

```
Al-noon-node/
├── server/             # Express + MongoDB backend
└── admin-dashboard/    # React + TypeScript admin UI
```

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

## Production build

To serve the admin dashboard from the Node server:

```bash
cd admin-dashboard
npm install
npm run build

cd ../server
npm install
npm run build
npm start
```

The server will serve the React build from `admin-dashboard/dist`.
