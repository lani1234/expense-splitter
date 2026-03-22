# Hosting Setup: Supabase + Railway + Vercel

## Stack
- **Database:** Supabase (managed PostgreSQL, free tier)
- **Backend:** Railway (Spring Boot JAR, auto-detected from Maven)
- **Frontend:** Vercel (static React/Vite build, free tier)

Future path: add a `Dockerfile` → migrate to Fly.io whenever ready. Railway also supports Docker natively so no lock-in.

---

## Code Changes Required Before Deploying

### 1. Frontend — environment-aware API base URL

`src/api/client.ts` currently hardcodes `baseURL: "/api"` which works via the Vite dev proxy but breaks in production (frontend on Vercel, backend on Railway = different domains).

**Change `client.ts`:**
```ts
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
})
```

Set `VITE_API_URL` in Vercel's environment variables to the Railway backend URL (e.g. `https://weeven-backend.up.railway.app/api`). In local dev it falls back to `/api` via the existing Vite proxy — no local `.env` file needed.

### 2. Backend — environment variable support for DB credentials

`application.properties` currently has hardcoded local DB values. Replace with environment variable placeholders so Railway can inject them:

```properties
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DATABASE_USERNAME}
spring.datasource.password=${DATABASE_PASSWORD}
```

Railway and Supabase both provide these as environment variables in their dashboards.

### 3. Backend — CORS configuration

The backend needs to accept requests from the Vercel frontend domain. Add a `WebMvcConfigurer` CORS config (or `@CrossOrigin`) that allows the Vercel URL. Use an environment variable so it works for both local dev and production:

```properties
cors.allowed-origins=${CORS_ALLOWED_ORIGINS:http://localhost:5173}
```

New file: `config/CorsConfig.java`
```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(allowedOrigins.split(","))
            .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH")
            .allowedHeaders("*");
    }
}
```

Set `CORS_ALLOWED_ORIGINS=https://weeven.vercel.app` in Railway environment variables.

---

## Deployment Steps

### Step 1 — Supabase (Database)

1. Create account at supabase.com → New project
2. Note the connection string: **Settings → Database → Connection string (URI mode)**
   - Format: `postgresql://postgres:[password]@[host]:5432/postgres`
3. No schema setup needed — Flyway migrations run automatically on first backend startup

### Step 2 — Railway (Backend)

1. Create account at railway.app → New project → Deploy from GitHub repo
2. Select the repository; set **Root Directory** to `/` (backend is at repo root)
3. Railway detects Maven automatically and runs `mvn package` + runs the JAR
4. Add environment variables in Railway dashboard:
   ```
   DATABASE_URL=jdbc:postgresql://[supabase-host]:5432/postgres
   DATABASE_USERNAME=postgres
   DATABASE_PASSWORD=[supabase-db-password]
   CORS_ALLOWED_ORIGINS=https://[your-vercel-url].vercel.app
   ```
5. Deploy → check logs for Flyway migration output confirming tables were created
6. Note the Railway public URL (e.g. `https://weeven-backend.up.railway.app`)

### Step 3 — Vercel (Frontend)

1. Create account at vercel.com → New project → Import GitHub repo
2. Set **Root Directory** to `frontend`
3. Vercel auto-detects Vite; build command `npm run build`, output dir `dist`
4. Add environment variable:
   ```
   VITE_API_URL=https://[your-railway-url].up.railway.app/api
   ```
5. Deploy → visit the Vercel URL to confirm the app loads and API calls succeed

---

## Local Development (unchanged)

No changes to local dev workflow. The Vite proxy (`vite.config.ts`) continues to forward `/api` → `http://localhost:8080` so `VITE_API_URL` is not needed locally.

---

## Future: Adding Docker

When ready, add a `Dockerfile` at the repo root:
```dockerfile
FROM eclipse-temurin:21-jre
COPY target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

Railway will automatically use it. Fly.io migration is then straightforward — same image, different platform config (`fly.toml`).
