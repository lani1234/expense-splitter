# Plan: Add Authentication (JWT + Guest Access)

## Context

The app currently has zero authentication — a hardcoded `CURRENT_USER_ID` UUID is passed as a request param, all instances are globally visible, and there's no user table. Adding auth enables multiple real users with isolated data. A "Continue as Guest" path lets someone try the app without signing up.

**Recommended approach:** Spring Security + stateless JWT (username/password). Self-contained, no external services. Guest access via a seeded guest user account that issues a normal JWT — simple and requires no special-casing anywhere in the auth flow.

**JWT storage:** localStorage (simpler; acceptable for a personal-use app).

---

## Scope Overview

This is a medium-large feature split into 4 phases. Each phase is independently deployable/testable.

---

## Phase 1 — Backend: User Table + Auth Endpoints

### 1a. Dependencies (pom.xml)
```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
  <groupId>io.jsonwebtoken</groupId>
  <artifactId>jjwt-api</artifactId>
  <version>0.12.6</version>
</dependency>
<dependency>
  <groupId>io.jsonwebtoken</groupId>
  <artifactId>jjwt-impl</artifactId>
  <version>0.12.6</version>
  <scope>runtime</scope>
</dependency>
<dependency>
  <groupId>io.jsonwebtoken</groupId>
  <artifactId>jjwt-jackson</artifactId>
  <version>0.12.6</version>
  <scope>runtime</scope>
</dependency>
```

### 1b. Migration V8 — app_user table + guest seed
```sql
CREATE TABLE app_user (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name  VARCHAR(100) NOT NULL,
  phone         VARCHAR(20),
  role          VARCHAR(20) NOT NULL DEFAULT 'REGISTERED',
  created_at    TIMESTAMP NOT NULL DEFAULT now()
);

-- Seed guest user (fixed UUID, bcrypt hash of "guest")
INSERT INTO app_user (id, email, password_hash, display_name, role)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'guest@weeven.app',
  '$2a$10$<generated_bcrypt_hash>',
  'Guest',
  'GUEST'
);
```

### 1c. New backend files
- `entity/AppUser.java` — JPA entity; implements Spring Security `UserDetails`; includes nullable `phone` field for future SMS notifications
- `repository/AppUserRepository.java` — `findByEmail(String)`
- `dto/AuthRequest.java` — record `{ email, password }`
- `dto/AuthResponse.java` — record `{ token, userId, displayName, role }`
- `service/JwtService.java` — generate/validate JWT; secret key in `application.properties`
- `service/AuthService.java` — register (BCrypt hash + save), login (authenticate + issue JWT), guestLogin (returns fixed guest JWT)
- `controller/AuthController.java` — `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/guest`
- `config/SecurityConfig.java` — disable CSRF, stateless sessions, permit `/api/auth/**` unauthenticated, require auth on all other `/api/**`
- `config/JwtAuthFilter.java` — `OncePerRequestFilter`; reads Bearer token, validates, sets `SecurityContextHolder`

### 1d. JWT payload
Claims: `sub` = userId (UUID string), `email`, `role`, `exp` (7 days for registered, 24h for guest).

### 1e. application.properties additions
```
jwt.secret=<256-bit-random-hex>
jwt.expiration-days=7
jwt.guest-expiration-hours=24
```

---

## Phase 2 — Backend: Secure Existing Endpoints

### 2a. Migration V9 — add user_id to template_instance
```sql
ALTER TABLE template_instance ADD COLUMN user_id UUID REFERENCES app_user(id);
UPDATE template_instance ti
SET user_id = t.user_id
FROM template t WHERE ti.template_id = t.id;
ALTER TABLE template_instance ALTER COLUMN user_id SET NOT NULL;
```

### 2b. Update TemplateInstance entity + DTO
Add `@ManyToOne(fetch = LAZY) AppUser user` field (mirrors existing Template pattern).
Update `TemplateInstanceResponse` to expose flat `userId` UUID.

### 2c. Extract userId from JWT instead of request param
- **TemplateController**: Remove `@RequestParam UUID userId` from `createTemplate`. Replace with `@AuthenticationPrincipal UserDetails` and extract UUID from principal.
- **InstanceController**: Same — add userId filter to `getAllInstances` so each user sees only their own.
- Pattern: `UUID userId = UUID.fromString(userDetails.getUsername())` (username field holds the UUID string).

### 2d. Ownership enforcement in services
- `TemplateService`: Before returning/modifying/deleting a template, verify `template.getUserId().equals(userId)`. Throw `ResourceNotFoundException` on mismatch (hides existence from non-owners).
- `InstanceService`: Add `findByUserId(userId)` query; replace `findAll()`.
- Guest user: no ownership restrictions — guest templates/instances are intentionally shared.

### 2e. API path change
`GET /api/templates/user/{userId}` → `GET /api/templates` (userId inferred from JWT). Keep old path as deprecated alias for now to avoid breaking anything during transition.

---

## Phase 3 — Frontend: Auth UI + Token Handling

### 3a. New dependency
```
npm install jwt-decode
```
(Decode JWT payload client-side to extract user info without a round-trip.)

### 3b. `src/context/AuthContext.tsx` (new)
```ts
interface AuthUser { id: string; email: string; displayName: string; role: "REGISTERED" | "GUEST" }
interface AuthContextValue {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  loginAsGuest: () => Promise<void>
  logout: () => void
}
```
- On mount: read token from localStorage, decode with `jwtDecode`, populate user state
- `login`/`register`/`loginAsGuest`: POST to `/api/auth/*`, store token in localStorage, set user state
- `logout`: clear localStorage, reset user, navigate to `/login`

### 3c. Update `src/api/client.ts`
- Add **request interceptor**: attach `Authorization: Bearer {token}` from localStorage
- Add **response interceptor**: on 401, clear token and `window.location.href = '/login'`

### 3d. `src/pages/LoginPage.tsx` (new)
- Toggle between Sign In / Register forms (register includes optional phone field)
- "Continue as Guest" button (calls `loginAsGuest`)
- Guest disclaimer: *"Guest data is shared and visible to all guests"*
- Redirect to `/templates` on success

### 3e. `src/components/ProtectedRoute.tsx` (new)
```tsx
export function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

### 3f. Update `src/App.tsx`
- Add `/login` route (outside `AppShell`, no `ProtectedRoute`)
- Wrap existing routes with `<ProtectedRoute>`
- Wrap everything with `<AuthProvider>`

### 3g. Remove `CURRENT_USER_ID`
- Delete `src/config/constants.ts`
- All call sites: replace with `useAuth().user!.id`
- `TEMPLATE_KEYS.byUser()` → use dynamic user id from context
- `INSTANCE_KEYS` → add user id: `["instances", "user", userId]`

### 3h. Update API functions
- `getTemplatesByUser(userId)` → `getTemplates()` (no param; backend infers from JWT)
- `getAllInstances()` → `getMyInstances()` (backend filters by JWT user)
- Remove `userId` from `createTemplate()` call

### 3i. NavBar updates
- Show `user.displayName` in top-right
- Logout button (`LogOut` lucide icon) that calls `logout()`
- If `user.role === 'GUEST'`: render a subtle top banner in `AppShell`:
  *"You're in guest mode — data is shared. [Create an account]"*

---

## Phase 4 — Guest UX Polish

- Guest user UUID `00000000-0000-0000-0000-000000000002` seeded in V8
- `POST /api/auth/guest` returns a 24h JWT for the guest user — same code path as login
- Guest sees shared templates/instances (no isolation — intentional)
- Guest banner with link to register (`/login?register=true` query param to pre-open the register form)
- Pre-seed a few demo templates/instances for the guest account in a V10 migration so new visitors see something useful immediately

---

## Critical Files

**New backend:**
- `src/main/java/com/expensesplitter/entity/AppUser.java`
- `src/main/java/com/expensesplitter/repository/AppUserRepository.java`
- `src/main/java/com/expensesplitter/dto/AuthRequest.java`, `AuthResponse.java`
- `src/main/java/com/expensesplitter/service/JwtService.java`, `AuthService.java`
- `src/main/java/com/expensesplitter/controller/AuthController.java`
- `src/main/java/com/expensesplitter/config/SecurityConfig.java`, `JwtAuthFilter.java`
- `src/main/resources/db/migration/V8__add_app_user_table.sql`
- `src/main/resources/db/migration/V9__add_user_id_to_template_instance.sql`

**Modified backend:**
- `pom.xml`
- `entity/TemplateInstance.java` + `dto/TemplateInstanceResponse.java`
- `controller/TemplateController.java`, `InstanceController.java`
- `service/TemplateService.java`, `InstanceService.java`
- `src/main/resources/application.properties`

**New frontend:**
- `frontend/src/context/AuthContext.tsx`
- `frontend/src/components/ProtectedRoute.tsx`
- `frontend/src/pages/LoginPage.tsx`

**Modified frontend:**
- `frontend/src/api/client.ts`, `templates.ts`, `instances.ts`
- `frontend/src/hooks/useTemplates.ts`, `useInstances.ts`
- `frontend/src/App.tsx`
- `frontend/src/components/layout/NavBar.tsx`, `AppShell.tsx`
- Delete `frontend/src/config/constants.ts`

---

## Verification

1. `mvn spring-boot:run` — app starts, Spring Security auto-configures
2. `POST /api/auth/register` → 200 + JWT
3. `GET /api/templates` without token → 401
4. `GET /api/templates` with Bearer token → 200, only that user's templates
5. `POST /api/auth/guest` → 200 + guest JWT
6. Frontend: visit `/templates` unauthenticated → redirected to `/login`
7. Register new account → land on `/templates` (empty)
8. Create a template + instance → visible only to that user; second user sees nothing
9. "Continue as Guest" → sees shared guest data + guest banner
10. NavBar shows display name + logout navigates to `/login`
