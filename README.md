# Notes App — Backend API

A multi-user notes REST API built with Node.js, Express, Prisma ORM, and PostgreSQL.

## Live Demo

> Deployed on Render: `https://notes-app-backend-rb51.onrender.com`
> API Docs (Swagger): `https://notes-app-backend-rb51.onrender.com/docs`

---

## Tech Stack

| Layer      | Technology              |
|------------|-------------------------|
| Backend    | Node.js + Express       |
| Database   | PostgreSQL (Neon)       |
| ORM        | Prisma                  |
| Auth       | JWT + bcrypt            |
| API Docs   | Swagger (OpenAPI 3.0)   |
| Deployment | Render                  |

---

## Features

- User registration and login with JWT authentication
- Create, read, update, delete notes
- Share notes with other users by email
- **Pin notes** — pinned notes always appear at the top of the list
- **Full-text search** — search notes by keyword across title and content
- **Pagination** — paginate the notes list with `page` and `limit` params
- Swagger UI at `/docs` and raw OpenAPI JSON at `/openapi.json`
- UUID validation on all note ID parameters
- Proper error handling with meaningful status codes

---

## API Endpoints

| Method | Path                  | Auth | Description                        |
|--------|-----------------------|------|------------------------------------|
| POST   | /register             | No   | Register new user                  |
| POST   | /login                | No   | Login, returns JWT                 |
| GET    | /notes                | Yes  | Get all notes (paginated)          |
| GET    | /notes/:id            | Yes  | Get note by ID                     |
| POST   | /notes                | Yes  | Create note                        |
| PUT    | /notes/:id            | Yes  | Update note (owner only)           |
| DELETE | /notes/:id            | Yes  | Delete note (owner only)           |
| POST   | /notes/:id/share      | Yes  | Share note with user by email      |
| PATCH  | /notes/:id/pin        | Yes  | Toggle pin status (owner only)     |
| GET    | /search?q=keyword     | Yes  | Full-text search across notes      |
| GET    | /openapi.json         | No   | OpenAPI 3.0 spec                   |
| GET    | /docs                 | No   | Swagger UI                         |
| GET    | /about                | No   | Developer info                     |

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/Sarvesh688/notes-app-backend.git
cd notes-app-backend
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:
```
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:password@host/dbname?sslmode=require"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3000
```

### 3. Set up the database

```bash
npx prisma db push
npx prisma generate
```

### 4. Run the server

```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Server runs at `http://localhost:3000`
Swagger UI at `http://localhost:3000/docs`

---

## Deployment on Render

### Step 1 — Get a free PostgreSQL DB from [neon.tech](https://neon.tech)
1. Sign up → New Project → copy the connection string

### Step 2 — Push code to GitHub
```bash
git add .
git commit -m "deploy"
git push
```

### Step 3 — Deploy on [render.com](https://render.com)
1. New → Web Service → connect your GitHub repo
2. **Build Command:** `npm install && npx prisma generate && npx prisma db push`
3. **Start Command:** `node src/index.js`
4. Add environment variables:
   - `DATABASE_URL`
   - `DATABASE_URL_UNPOOLED`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN` = `7d`
5. Deploy

---

## Project Structure

```
notes-app/
├── prisma/
│   ├── schema.prisma          # DB schema (User, Note, SharedNote)
│   └── migrations/            # SQL migrations
├── src/
│   ├── config/
│   │   ├── prisma.js          # Prisma client singleton
│   │   └── swagger.js         # Swagger/OpenAPI setup
│   ├── controllers/           # Request validation + response shaping
│   │   ├── auth.controller.js
│   │   ├── note.controller.js
│   │   └── search.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js # JWT verification + UUID validation
│   ├── routes/                # Express routers with Swagger JSDoc
│   │   ├── auth.routes.js
│   │   ├── note.routes.js
│   │   ├── search.routes.js
│   │   └── about.routes.js
│   ├── services/              # Business logic + Prisma queries
│   │   ├── auth.service.js
│   │   └── note.service.js
│   └── index.js               # App entry point
├── .env.example               # Environment variable template
├── .gitignore
├── Dockerfile
├── render.yaml
└── package.json
```

---

## Architecture

```
Request → Routes → Controllers → Services → Prisma ORM → PostgreSQL
                       ↑
               Auth Middleware (JWT)
```

---

## Docker

```bash
docker build -t notes-app .
docker run -p 3000:3000 --env-file .env notes-app
```
