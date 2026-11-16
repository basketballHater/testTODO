# To-Do App

Small task manager. MySQL, a Laravel API and a React (Vite) frontend.

## Run with Docker

Needs Docker with Compose.

    docker compose up --build

Open http://localhost:8080. The API is at http://localhost:8000/api/tasks.
The first start creates the tables and adds five sample tasks.

Stop with `docker compose down` (add `-v` to also delete the database).

## Run without Docker

Needs PHP 8.2+ (with pdo_mysql), Composer, MySQL 8 and Node 20+.

Create the database:

    CREATE DATABASE todo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    CREATE USER 'todo'@'%' IDENTIFIED BY 'secret';
    GRANT ALL ON todo.* TO 'todo'@'%';

Backend:

    cd backend
    composer install
    cp .env.example .env
    php artisan key:generate
    php artisan migrate
    php artisan db:seed        # optional sample data
    php artisan serve          # http://localhost:8000

Frontend (in another terminal):

    cd frontend
    npm install
    npm run dev                # http://localhost:5173

The dev server forwards `/api` to `localhost:8000`.

### Build

Only the frontend has a build step:

    cd frontend
    npm run build              # output in frontend/dist

`dist` is static files. Serve them from the same host as `/api`
(the Docker setup does this with nginx, see `frontend/nginx.conf`).

## Tests

Backend (uses in-memory SQLite by default, needs the pdo_sqlite extension):

    cd backend
    php artisan test

To run against MySQL instead, use a database whose name ends in `_test`:

    DB_CONNECTION=mysql DB_DATABASE=todo_test DB_USERNAME=todo DB_PASSWORD=secret php artisan test

Frontend unit tests:

    cd frontend
    npm test

End-to-end tests (Playwright). The full app must be running, and the tests
delete all tasks, so don't use a database you care about:

    cd frontend
    npx playwright install chromium
    npm run e2e                # expects http://localhost:8080

Same tests through Docker:

    docker compose --profile test run --rm backend-tests
    docker compose --profile test run --rm frontend-tests
    docker compose up -d --build
    docker compose --profile e2e run --rm e2e

## API

| Method | Path                       | Purpose                        |
| ------ | -------------------------- | ------------------------------ |
| GET    | `/api/tasks`               | latest 5 incomplete tasks      |
| POST   | `/api/tasks`               | create (`title`, `description`) |
| GET    | `/api/tasks/{id}`          | get one                        |
| PUT    | `/api/tasks/{id}`          | edit title and description     |
| PATCH  | `/api/tasks/{id}/complete` | mark as done                   |
| DELETE | `/api/tasks/{id}`          | delete                         |

## Notes

- Table `task`: `id`, `title`, `description`, `completed_at` (null while open),
  `created_at`, `updated_at`. There is an index on `(completed_at, created_at)`
  for the "latest 5 open tasks" query.
- Backend layers: controller, service (business rules), repository (database access).
- Only the title is required; the description is optional.
