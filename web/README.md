# Costy Web App

The core SPA for the Costy platform — a personal and collaborative budget tracker built with React and Vite.

## Auth Model

- Access token stored **in memory only** (no localStorage)
- Refresh token managed via **HttpOnly cookie**
- Automatic 401 → refresh → retry flow in `src/lib/api/httpClient.ts`
- Auth UI provided by `auth-component-react`

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Email/password login |
| `/register` | New account registration |
| `/project-selection` | Choose or create a project |
| `/dashboard` | Project overview and quick actions |
| `/purchase/new` | Add a new purchase |
| `/income/new` | Add a new income |
| `/add` | Quick-add transaction selector |
| `/statistics/events` | Transaction event timeline |
| `/statistics/chart` | Spending breakdown charts |
| `/settings/profile` | User profile preferences |
| `/settings/categories` | Manage purchase/income categories |
| `/settings/limits` | Set category spending limits |
| `/settings/members` | View and manage project members |
| `/settings/invites` | Create and revoke invite codes |
| `/settings/general` | General project settings |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest test suite |

## Setup

```bash
cp .env.example .env
npm ci
npm run dev
```

The dev server starts at [http://localhost:5173](http://localhost:5173).

## Environment Variables

See `.env.example` for the full list. All variables are prefixed with `VITE_` and configure backend service URLs:

```
VITE_AUTH_URL=http://localhost:8100
VITE_USER_URL=http://localhost:8095
VITE_MONEY_ACTIONS_URL=http://localhost:8300
VITE_STATISTICS_URL=http://localhost:8301
VITE_PROFILE_SERVICE_URL=http://localhost:8302
VITE_PROJECT_SERVICE_URL=http://localhost:8303
```

## Production Build

```bash
npm run build
```

Output goes to `dist/`. Served by Nginx in production (`nginx.prod.conf`), with a `/health` endpoint for Kubernetes liveness probes.
