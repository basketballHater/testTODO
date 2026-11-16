.PHONY: up down reset logs test test-backend test-frontend test-e2e

up:            ## build and start the whole stack
	docker compose up --build

down:          ## stop the stack (keeps the database volume)
	docker compose down

reset:         ## stop the stack and delete the database volume
	docker compose down -v

logs:
	docker compose logs -f

test: test-backend test-frontend   ## unit + integration tests, in containers

test-backend:
	docker compose --profile test run --rm backend-tests

test-frontend:
	docker compose --profile test run --rm frontend-tests

test-e2e:      ## needs the stack: run `make up` (or `docker compose up -d --build`) first
	docker compose --profile e2e run --rm e2e
