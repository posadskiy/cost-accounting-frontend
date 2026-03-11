# Costy Web

Web application for personal and family budget managing: purchases, incomes, statistics (charts and tables), profile and category management.

- **Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, TanStack Query.
- **Backend:** Costy microservices (money-actions, statistics, profile-service, bff-web) and external auth/user services.

## Getting started

The app lives in the `web/` directory. From repo root:

```bash
cd web
npm ci
npm run dev
```

Or use the root scripts (they delegate to `web/`):

```bash
npm run build   # builds web app
npm run dev     # runs dev server (from web/)
```

Open [http://localhost:3000](http://localhost:3000) (or the port Next.js prints).

## CI

GitHub Actions run lint and build from `web/` on changes under `web/**`. See `.github/workflows/web-ci.yml`.

## Mobile

Native iOS/Android clients are not part of this repo at the moment; they may be added later.
