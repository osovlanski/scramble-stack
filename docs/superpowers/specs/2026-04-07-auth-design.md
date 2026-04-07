# Auth System Design

## Goal

Add a hybrid auth system: dev mode silently auto-logs in (no UI), production shows Google Sign-In. All protected routes use the existing JWT `authMiddleware` unchanged.

## Architecture

### Two-mode strategy

| Mode | Trigger | UX |
|---|---|---|
| Dev | `NODE_ENV=development` | `AuthGuard` auto-calls `GET /api/auth/dev`, stores token, renders app — user sees nothing |
| Production | `NODE_ENV=production` | `AuthGuard` redirects to `LoginPage`, user clicks "Sign in with Google", popup flow |

### Why Google Identity Services (no redirect flow)

SPAs don't benefit from the OAuth redirect/callback pattern. Instead, the frontend loads Google's `accounts.google.com/gsi/client` script which opens a popup and returns an ID token directly in the browser. The backend receives that token, verifies it with `google-auth-library`, and issues its own JWT. No callback URLs, no session cookies, no CSRF surface.

---

## Backend

### Schema change

Add `googleId` to `User`:

```prisma
model User {
  id        String  @id @default(uuid())
  email     String  @unique
  name      String?
  googleId  String? @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  diagrams        Diagram[]
  customNodeTypes CustomNodeType[]
}
```

### New files

**`src/auth/authController.ts`**

- `googleSignIn(req, res)` — receives `{ idToken }`, verifies with `google-auth-library` (`OAuth2Client.verifyIdToken`), upserts User by `googleId` (or email fallback), returns signed JWT
- `devLogin(req, res)` — only active when `NODE_ENV !== production`; upserts a fixed dev user (`dev@localhost`, id `dev-user`), returns signed JWT with 30-day expiry

**`src/auth/routes.ts`**

```
POST /api/auth/google   → authController.googleSignIn
GET  /api/auth/dev      → authController.devLogin  (404 in production)
```

No `authMiddleware` on these routes — they are the entry point.

### New dependencies

- `google-auth-library` — verifies Google ID tokens server-side

### Environment variables

| Variable | Required in prod | Notes |
|---|---|---|
| `GOOGLE_CLIENT_ID` | yes | Google Cloud Console → OAuth 2.0 credentials |

---

## Frontend

### New files

**`src/auth/useAuth.ts`**

- `getToken()` — reads `localStorage.auth_token`
- `setToken(token)` — writes to `localStorage.auth_token`
- `clearToken()` — removes token, used by sign-out
- `isDevMode()` — returns `import.meta.env.DEV`

**`src/auth/AuthGuard.tsx`**

Wraps all protected routes. On mount:
1. If token exists → render children
2. If `isDevMode()` → call `GET /api/auth/dev`, store token, render children
3. Otherwise → render `<LoginPage />`

Shows a blank screen (no flash) while the dev token is being fetched.

**`src/auth/LoginPage.tsx`**

- Loads the Google Identity Services script (`accounts.google.com/gsi/client`)
- Renders a "Sign in with Google" button using `google.accounts.id.renderButton`
- On credential response: calls `POST /api/auth/google` with the ID token
- On success: stores JWT, triggers re-render of `AuthGuard`

**`src/App.tsx`** (modified)

Wraps canvas routes with `AuthGuard`:

```tsx
<Route path="/canvas" element={<AuthGuard><DiagramList /></AuthGuard>} />
<Route path="/canvas/:id" element={<AuthGuard><CanvasBoard /></AuthGuard>} />
```

### New environment variables

| Variable | Notes |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Same value as `GOOGLE_CLIENT_ID` — safe to expose, it's a public identifier |

---

## Data flow (production)

```
LoginPage loads Google script
  → google.accounts.id.initialize({ client_id: VITE_GOOGLE_CLIENT_ID })
  → user clicks button → Google popup opens
  → user selects account → popup returns { credential: "<ID token>" }
  → POST /api/auth/google { idToken: credential }
  → backend: OAuth2Client.verifyIdToken → extract { sub, email, name }
  → prisma.user.upsert({ where: { googleId: sub }, ... })
  → jwt.sign({ userId: user.id }) → return { token }
  → frontend: localStorage.setItem('auth_token', token)
  → AuthGuard re-renders → children shown
```

## Data flow (dev)

```
AuthGuard mounts → no token → isDevMode() === true
  → GET /api/auth/dev
  → backend: prisma.user.upsert({ where: { email: 'dev@localhost' }, ... })
  → jwt.sign({ userId: devUser.id }) → return { token }
  → localStorage.setItem('auth_token', token)
  → AuthGuard re-renders → children shown
```

---

## Security notes

- `GET /api/auth/dev` returns `404` when `NODE_ENV === production` — cannot be called in prod
- Google ID tokens are short-lived (1hr); the backend verifies signature and expiry via `google-auth-library`
- The app's own JWT uses the existing `JWT_SECRET` and `authMiddleware` — no changes to protected routes
- `VITE_GOOGLE_CLIENT_ID` is intentionally public (Google requires it in the browser); `GOOGLE_CLIENT_ID` on the backend is used only for server-side token verification

---

## Tests

- `authController.googleSignIn` — mock `OAuth2Client.verifyIdToken`, assert user upserted and JWT returned
- `authController.devLogin` — assert returns JWT in dev, 404 in production
- `AuthGuard` — mock `isDevMode`, assert auto-fetch in dev and LoginPage render in prod
