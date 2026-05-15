# Notes App — Backend API

A multi-user notes REST API built with Node.js, Express, Prisma, and PostgreSQL.

## Stack

| Layer      | Technology              |
|------------|-------------------------|
| Backend    | Node.js + Express       |
| Database   | PostgreSQL               |
| ORM        | Prisma                  |
| Auth       | JWT + bcrypt            |
| API Docs   | Swagger (OpenAPI 3.0)   |
| Deployment | Render                  |

## Features

- User registration & JWT authentication
- Create, read, update, delete notes
- Share notes with other users by email
- **Pin notes** — pinned notes appear at the top of the list
- **Full-text search** — search notes by keyword across title and content
- **Pagination** — paginate the notes list with `page` and `limit` params
- Swagger UI at `/docs` and raw OpenAPI JSON at `/openapi.json`

## API Endpoints

| Method | Path              | Auth | Description                        |
|--------|-------------------|------|------------------------------------|
| POST   | /register         | No   | Register new user                  |
| POST   | /login            | No   | Login, returns JWT                 |
| GET    | /notes            | Yes  | Get all notes (paginated)          |
| GET    | /notes/:id        | Yes  | Get note by ID                     |
| POST   | /notes            | Yes  | Create note                        |
| PUT    | /notes/:id        | Yes  | Update note                        |
| DELETE | /notes/:id        | Yes  | Delete note                        |
| POST   | /notes/:id/share  | Yes  | Share note with user by email      |
| PATCH  | /notes/:id/pin    | Yes  | Toggle pin status                  |
| GET    | /search?q=keyword | Yes  | Full-text search                   |
| GET    | /openapi.json     | No   | OpenAPI 3.0 spec                   |
| GET    | /docs             | No   | Swagger UI                         |
| GET    | /about            | No   | Developer info                     |

## Local Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd notes-app
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/notesdb"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3000
```

### 3. Set up the database

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Run the server

```bash
# Development
npm run dev

# Production
npm start
```

## Deployment on Render

### Step 1: Create a free PostgreSQL database on Neon

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string (it looks like `postgresql://user:pass@host/dbname?sslmode=require`)

### Step 2: Push code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/notes-app.git
git push -u origin main
```

### Step 3: Deploy on Render

1. Go to [render.com](https://render.com) and sign up
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command:** `node src/index.js`
5. Add environment variables:
   - `DATABASE_URL` → your Neon connection string
   - `JWT_SECRET` → any long random string
   - `JWT_EXPIRES_IN` → `7d`
6. Click **Deploy**

Your API will be live at `https://your-app-name.onrender.com`

## Docker

```bash
docker build -t notes-app .
docker run -p 3000:3000 --env-file .env notes-app
```

## Project Structure

```
notes-app/
├── prisma/
│   ├── schema.prisma          # DB schema
│   └── migrations/            # SQL migrations
├── src/
│   ├── config/
│   │   ├── prisma.js          # Prisma client singleton
│   │   └── swagger.js         # Swagger setup
│   ├── controllers/           # Request handlers
│   ├── middleware/
│   │   └── auth.middleware.js # JWT verification
│   ├── routes/                # Express routers with Swagger docs
│   ├── services/              # Business logic
│   └── index.js               # App entry point
├── Dockerfile
├── render.yaml
└── package.json
```
