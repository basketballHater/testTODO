# testTODO
Test project for Telecom

## To-Do Tasks

A small task manager: **MySQL → Laravel REST API → React SPA**.

| Layer    | Tech                                                                  |
| -------- | --------------------------------------------------------------------- |
| Database | MySQL 8 (table `task`)                                                |
| Backend  | PHP 8.2+ / Laravel 12, PHPUnit                                        |
| Frontend | React 19 + TypeScript, Vite, Tailwind CSS, Vitest + Testing Library   |
| E2E      | Playwright                                                            |
| Infra    | Docker + docker-compose (one command), GitHub Actions CI              |

## Features

- Create a task (title + description); edit title/description of any task.
- Only the **5 most recent incomplete tasks** are listed (the rule lives on the server).
- **Done** hides a task; **Delete** removes it permanently.
- Client-side and server-side validation (title required, ≤ 255 chars).

---

## Quick start (Docker — recommended)

Prerequisites: Docker with the Compose plugin. Nothing else.

```bash
docker compose up --build
```

Then open **http://localhost:8080**. The API is also exposed at http://localhost:8000/api/tasks.
On first start the database is migrated and seeded with the five tasks from the UI mockup
(set `DB_SEED=false` in a `.env` file — see `.env.example` — for an empty list).

```bash
docker compose down        # stop (keeps data)
docker compose down -v     # stop and delete the database volume
```

### Running the tests in Docker

```bash
docker compose --profile test run --rm backend-tests    # PHPUnit against MySQL (todo_test database)
docker compose --profile test run --rm frontend-tests   # Vitest
docker compose up -d --build                            # e2e needs the stack running
docker compose --profile e2e run --rm e2e               # Playwright
```

`make test`, `make test-e2e`, `make up`, `make reset` are shortcuts for the above.

---

## Running locally (without Docker)

### Prerequisites

- PHP ≥ 8.2 with `pdo_mysql`, `mbstring`, `zip` (and `pdo_sqlite` for the default test setup)
- Composer 2
- MySQL 8 (or MariaDB 10.6+)
- Node.js ≥ 20 and npm

### 1. Database

```sql
CREATE DATABASE todo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'todo'@'%' IDENTIFIED BY 'secret';
GRANT ALL ON todo.* TO 'todo'@'%';
```

### 2. Backend API

```bash
cd backend
composer install
cp .env.example .env          # adjust DB_* if needed
php artisan key:generate
php artisan migrate           # creates the `task` table
php artisan db:seed           # optional demo data
php artisan serve             # http://localhost:8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

The dev server proxies `/api` to `http://localhost:8000`
(override with `VITE_API_PROXY_TARGET`).

### Build step (frontend)

The SPA is TypeScript bundled by Vite — the only component that needs a build:

```bash
cd frontend
npm run build                 # type-check (tsc -b) + bundle into frontend/dist
npm run preview               # optional: serve the production build on :4173
```

`dist/` is plain static files. In production they must be served from the same origin as
`/api` (or set `VITE_API_BASE_URL` at build time to the API's URL and enable CORS);
the Docker setup does this with nginx (`frontend/nginx.conf`).

---

## Tests

### Backend (PHPUnit)

```bash
cd backend
php artisan test              # defaults to in-memory SQLite: no setup needed
```

To run the same suite against MySQL, point it at a database whose name ends in `_test`:

```bash
DB_CONNECTION=mysql DB_DATABASE=todo_test DB_USERNAME=todo DB_PASSWORD=secret php artisan test
```

`tests/TestCase.php` refuses to run on any other database, because `RefreshDatabase` drops tables.

| Suite       | What it covers                                                                          |
| ----------- | --------------------------------------------------------------------------------------- |
| Unit        | `TaskService` rules with a mocked repository; `TaskResource` output                     |
| Integration | `EloquentTaskRepository` against a real DB; schema (table name, columns, index, nulls)  |
| Feature     | Every HTTP endpoint: CRUD, validation, 404s, top-5 ordering, completion, idempotency    |

### Frontend (Vitest + React Testing Library)

```bash
cd frontend
npm test                      # run once
npm run test:watch
npm run test:coverage
npm run lint && npm run typecheck
```

### End-to-end (Playwright)

Needs the full stack running (e.g. `docker compose up -d --build`).

```bash
cd frontend
npm run e2e:install                       # once: downloads Chromium
npm run e2e                               # against http://localhost:8080
E2E_BASE_URL=http://localhost:5173 npm run e2e   # against the local dev server
```

Each test empties the task table through the API first, so **never run e2e against data you care about**.

---

## API

Base path `/api`. Responses are wrapped in `{ "data": ... }`; validation errors are
`422 { "message": "...", "errors": { "title": ["..."] } }`.

| Method | Path                       | Description                                   | Success |
| ------ | -------------------------- | --------------------------------------------- | ------- |
| GET    | `/api/tasks`               | Latest 5 incomplete tasks, newest first       | 200     |
| POST   | `/api/tasks`               | Create `{ title, description? }`              | 201     |
| GET    | `/api/tasks/{id}`          | Read one task                                 | 200     |
| PUT    | `/api/tasks/{id}`          | Update `{ title, description? }`              | 200     |
| PATCH  | `/api/tasks/{id}/complete` | Mark as done (idempotent)                     | 200     |
| DELETE | `/api/tasks/{id}`          | Delete permanently                            | 204     |

Task JSON: `id, title, description, completed, completed_at, created_at, updated_at`.

## Design notes

**Architecture** — each layer only knows the one below it:

```
React components ─▶ useTasks hook ─▶ TaskApi (interface) ─▶ fetch
                                                              │
Controller ─▶ FormRequest (validation) ─▶ TaskService ─▶ TaskRepositoryInterface ─▶ Eloquent ─▶ MySQL
            └▶ TaskResource (JSON shape)   (business rules)      (persistence contract)
```

- **Backend** — controllers are thin HTTP adapters; business rules (the "latest 5" limit, idempotent
  completion) live in `TaskService`; persistence sits behind `TaskRepositoryInterface` (bound in
  `AppServiceProvider`), so the service is unit-tested with a mock and no database (SRP, DIP, OCP).
- **Frontend** — presentational components (`TaskForm`, `TaskList`, `TaskCard`) are separated from state
  (`useTasks`) and from I/O (`TaskApi`). Tests inject an in-memory fake API instead of mocking `fetch`.
  After every mutation the list is re-fetched, so the UI can never disagree with the server's top-5 rule.
- **Database** — table `task`: `id` PK, `title VARCHAR(255) NOT NULL`, `description TEXT NULL`,
  `completed_at TIMESTAMP NULL` (NULL = open; also records *when* it was finished), `created_at`,
  `updated_at`. Composite index `task_open_recent_index (completed_at, created_at)` serves the only hot
  query (`WHERE completed_at IS NULL ORDER BY created_at DESC, id DESC LIMIT 5`); InnoDB appends the
  primary key to the index, covering the `id` tie-break.
- **Choices worth knowing** — "Done" is a soft state (`completed_at`), Delete is a hard delete.
  The task is *completed*, not *archived*; there is no endpoint to list or un-complete finished tasks
  because the requirements don't ask for one.
- No authentication: the brief doesn't call for it.
