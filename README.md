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
