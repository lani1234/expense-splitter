# Add Login Page with AWS Cognito Authentication

## Context

The app is currently single-user with a hardcoded `CURRENT_USER_ID` (`00000000-0000-0000-0000-000000000001`) in the frontend. The goal is to deploy this app publicly on AWS so other people can sign up, log in, and use it with fully isolated data (each user only sees their own templates and instances).

Authentication will be handled by **AWS Cognito** — a managed identity service that handles user accounts, passwords, and JWT token issuance. The app builds a custom login UI but delegates all auth logic to Cognito. This fits naturally into the broader roadmap of Docker + GitHub Actions + AWS deployment.

The existing `user_id` column on the `template` table is already designed for this — replacing the hardcoded UUID with the Cognito JWT `sub` claim is the core change.

---

## Prerequisites

Before writing any code, the following AWS resources must exist:
- An AWS Cognito **User Pool** (provides Pool ID and Region)
- A Cognito **App Client** within that pool (provides Client ID)

See `docs/plans/aws-cognito-setup.md` for setup instructions.

---

## Architecture

```
React (login page)
  → submits email + password to Cognito SDK
  → Cognito returns JWT (access token + id token)
  → JWT stored in localStorage / memory
  → all API calls include: Authorization: Bearer <token>

Spring Boot backend
  → Spring Security validates JWT signature against Cognito's public keys
  → reads `sub` claim from JWT → uses as user_id
  → no longer accepts userId as a query/path param
```

---

## Implementation Plan

### 1. Frontend: New environment variables

Add to `frontend/.env.local` (and document in `.env.example`):
```
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_COGNITO_REGION=us-east-1
```

### 2. Frontend: Install Cognito SDK

```bash
cd frontend
npm install amazon-cognito-identity-js
```

### 3. Frontend: Auth utility (`src/lib/auth.ts`)

Wrap the Cognito SDK to expose:
- `signIn(email, password)` → returns JWT tokens
- `signOut()`
- `getCurrentUser()` → returns decoded JWT or null
- `getAccessToken()` → returns raw JWT string for API calls
- `getUserId()` → returns `sub` claim (replaces `CURRENT_USER_ID`)

### 4. Frontend: Auth context (`src/context/AuthContext.tsx`)

React context that:
- Holds current user state
- Exposes `signIn`, `signOut`, `user`, `isLoading`
- On mount, checks localStorage for an existing session

### 5. Frontend: Login page (`src/pages/LoginPage.tsx`)

Simple form with:
- Email + password fields
- Sign in button
- Error display (wrong password, user not found, etc.)
- Optionally: "Sign up" / "Forgot password" flows (Cognito handles the logic)

### 6. Frontend: Protected route

Wrap `AppShell` routes so unauthenticated users are redirected to `/login`.

### 7. Frontend: Attach JWT to API calls

In `src/api/client.ts`, add a request interceptor:
```ts
axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

### 8. Frontend: Remove `CURRENT_USER_ID`

- Delete `src/config/constants.ts`
- Replace all usages with `getUserId()` from the auth utility
- `useTemplates.ts`: use `getUserId()` instead of `CURRENT_USER_ID`

### 9. Backend: Add Spring Security + Cognito JWT dependency

Add to `pom.xml`:
```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
```

### 10. Backend: Configure JWT validation

Add to `application.properties`:
```properties
spring.security.oauth2.resourceserver.jwt.issuer-uri=https://cognito-idp.${AWS_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}
```

Add env vars: `AWS_REGION`, `COGNITO_USER_POOL_ID`.

### 11. Backend: Security config (`SecurityConfig.java`)

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/**").authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
        return http.build();
    }
}
```

### 12. Backend: Read user ID from JWT

Create a helper to extract `sub` from the JWT in controllers/services:
```java
// In controller methods:
@AuthenticationPrincipal Jwt jwt
String userId = jwt.getSubject(); // the Cognito sub
```

### 13. Backend: Remove userId from API surface

- `POST /api/templates` — remove `?userId=` query param; read from JWT instead
- `GET /api/templates/user/{userId}` — remove path param; read from JWT instead
- Update `TemplateController` and `TemplateService` accordingly

---

## Files to Modify

| File | Change |
|---|---|
| `frontend/src/config/constants.ts` | Delete |
| `frontend/src/api/client.ts` | Add JWT Authorization header interceptor |
| `frontend/src/api/templates.ts` | Remove userId params from API calls |
| `frontend/src/hooks/useTemplates.ts` | Replace `CURRENT_USER_ID` with `getUserId()` |
| `frontend/src/components/templates/WizardStep1.tsx` | Replace `CURRENT_USER_ID` with `getUserId()` |
| `pom.xml` | Add spring-security + oauth2-resource-server |
| `src/main/resources/application.properties` | Add Cognito issuer-uri config |
| `src/main/java/.../controller/TemplateController.java` | Read user from JWT, remove userId params |
| `src/main/java/.../service/TemplateService.java` | Accept userId from controller (no change to signature needed) |

## New Files

| File | Purpose |
|---|---|
| `frontend/src/lib/auth.ts` | Cognito SDK wrapper |
| `frontend/src/context/AuthContext.tsx` | React auth context + provider |
| `frontend/src/pages/LoginPage.tsx` | Login form UI |
| `src/main/java/.../config/SecurityConfig.java` | Spring Security + JWT config |

---

## Verification

1. Start backend (`mvn spring-boot:run`) and frontend (`npm run dev`)
2. Navigate to app → should redirect to `/login`
3. Sign in with a Cognito test user → should reach the dashboard
4. Create a template → verify it's stored with the Cognito `sub` as `user_id` in the DB
5. Sign in as a different test user → should see no templates (data isolation works)
6. Open network tab → confirm `Authorization: Bearer ...` header on all API calls
7. Call a protected endpoint directly without a token → should get `401 Unauthorized`
