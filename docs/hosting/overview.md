# Hosting Overview

## Live URLs

| | URL |
|---|---|
| **Frontend** | https://weeven.vercel.app |
| **Backend API** | https://expense-splitter-production-e997.up.railway.app/api |

## Stack

| Layer | Platform | Notes |
|-------|----------|-------|
| Database | Supabase | Managed PostgreSQL, free tier |
| Backend | Railway | Spring Boot JAR, auto-detected from Maven |
| Frontend | Vercel | Static React/Vite build, free tier |

---

## Supabase (Database)

- Data API and RLS are disabled — the app uses Spring Boot as the backend, not supabase-js
- Uses the **connection pooler**, not the direct connection — Railway does not support IPv6, which new Supabase projects use for direct connections
  - Pooler host format: `aws-0-[region].pooler.supabase.com`, port `6543`
- Flyway migrations ran automatically on first backend startup; no manual schema setup was needed

---

## Railway (Backend)

- Root directory: `/` (backend is at repo root)
- Railway detects Maven automatically and runs `mvn package` + runs the JAR

**Environment variables configured:**

| Variable | Value |
|----------|-------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://[pooler-host]:6543/postgres?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | `postgres.[project-ref]` (pooler requires this format) |
| `SPRING_DATASOURCE_PASSWORD` | _(Supabase DB password)_ |
| `CORS_ALLOWED_ORIGINS` | `https://weeven.vercel.app` |

> `SPRING_DATASOURCE_*` variable names are read natively by Spring Boot without needing `application.properties` substitution.

---

## Vercel (Frontend)

- Root directory: `frontend`
- Build command: `npm run build`, output directory: `dist`
- Vite auto-detected

**Environment variables configured:**

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://expense-splitter-production-e997.up.railway.app/api` |

> No trailing spaces — Vite bakes this value into the bundle at build time.

---

## Local Development

No changes to local workflow. The Vite proxy (`vite.config.ts`) forwards `/api` → `http://localhost:8080`. `VITE_API_URL` is not needed locally and no local `.env` file is required.

---

## Code Changes Made for Hosting

These are complete and checked in:

| File | Change |
|------|--------|
| `frontend/src/api/client.ts` | `baseURL` uses `import.meta.env.VITE_API_URL ?? "/api"` |
| `frontend/src/vite-env.d.ts` | Added so TypeScript recognises `import.meta.env` |
| `src/main/resources/application.properties` | DB credentials use `${VAR:default}` env var syntax |
| `src/main/java/com/expensesplitter/config/CorsConfig.java` | Reads `CORS_ALLOWED_ORIGINS` env var, applies to all `/api/**` routes |

---

## Future: Docker Path

When ready, add a `Dockerfile` at the repo root:

```dockerfile
FROM eclipse-temurin:21-jre
COPY target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

Railway will use it automatically. Fly.io migration is then straightforward — same image, different platform config (`fly.toml`).
