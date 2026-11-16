# ---- build: installs everything (incl. dev deps), type-checks and bundles the SPA.
# Also the target used for running the unit tests: `docker compose --profile test run frontend-tests`
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- e2e: Playwright with browsers preinstalled (version must match @playwright/test)
FROM mcr.microsoft.com/playwright:v1.65.1-noble AS e2e
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
CMD ["npx", "playwright", "test"]

# ---- runtime: static files + reverse proxy for /api (default target)
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
