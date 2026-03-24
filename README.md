# Costy Frontend

Web application for the Costy budget management platform. A React single-page application that provides a complete interface for tracking purchases and incomes, viewing spending statistics, and managing projects and team settings.

## Features

- **Dashboard** — overview of the active project with quick-access actions
- **Transaction entry** — add purchases and incomes with category, amount, currency, and date selection
- **Statistics** — event timeline, spending charts, and category breakdowns with monthly navigation
- **Project management** — create projects, invite members via shareable codes, manage roles
- **Settings** — profile preferences, per-project categories, spending limits, member management, invite codes
- **Authentication** — login, registration, and token-based auth with automatic refresh

## Tech Stack

- **Build:** Vite 6
- **UI:** React 19, TypeScript 5
- **Routing:** React Router 7
- **State/Data:** TanStack Query, React Hook Form + Zod
- **Components:** Mantine 7, MUI 5
- **Styling:** Tailwind CSS 4, Emotion
- **Auth:** `auth-component-react` (in-memory access token, HttpOnly refresh cookie)
- **Testing:** Vitest
- **Linting:** ESLint 9

## Project Structure

```
cost-accounting-frontend/
├── web/                            # Application source
│   ├── src/
│   │   ├── main.tsx                # Entry point with React Router
│   │   ├── app/                    # Pages (file-based route structure)
│   │   │   ├── dashboard/
│   │   │   ├── purchase/new/
│   │   │   ├── income/new/
│   │   │   ├── statistics/         # events/, chart/
│   │   │   ├── settings/           # profile/, categories/, limits/, members/, invites/, general/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── project-selection/
│   │   ├── components/             # Shared UI components
│   │   └── lib/
│   │       ├── api/                # HTTP client with 401 refresh-and-retry
│   │       ├── auth/               # Auth context and token management
│   │       └── config/             # Endpoint URLs and app config
│   ├── public/
│   ├── vite.config.ts
│   ├── .env.example
│   ├── Dockerfile.prod
│   └── nginx.prod.conf
├── deployment/                     # K8s manifest
├── .github/workflows/web-ci.yml   # CI: lint + build on Node 22
└── package.json                    # Root scripts (delegates to web/)
```

## Getting Started

### Prerequisites

- Node.js 22+

### Development

```bash
cd web
cp .env.example .env
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Root Scripts

The root `package.json` delegates to `web/` for convenience:

```bash
npm run dev     # Start dev server
npm run build   # Production build
```

### Environment Variables

Copy `web/.env.example` and configure backend service URLs:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_AUTH_URL` | Auth service | `http://localhost:8100` |
| `VITE_USER_URL` | User service | `http://localhost:8095` |
| `VITE_MONEY_ACTIONS_URL` | Money actions service | `http://localhost:8300` |
| `VITE_STATISTICS_URL` | Statistics service | `http://localhost:8301` |
| `VITE_PROFILE_SERVICE_URL` | Profile service | `http://localhost:8302` |
| `VITE_PROJECT_SERVICE_URL` | Project service | `http://localhost:8303` |

## CI/CD

GitHub Actions workflow (`.github/workflows/web-ci.yml`) runs on pushes to `main` and pull requests affecting `web/**`:

1. Checkout
2. Setup Node 22
3. `npm ci`
4. `npm run lint`
5. `npm run build`

## Production

- **Docker:** Multi-stage build with Nginx serving the static SPA
- **Kubernetes:** Deployment + Service on port 3000, health checks via `/health` (Nginx)
- **Domain:** `costy.posadskiy.com`
