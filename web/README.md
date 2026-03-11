# Costy Web

This app replaces the legacy React Native client in-place with a React web client while preserving feature parity.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript 5 (strict)
- Tailwind CSS 4
- ESLint 9

## Auth model

- SPA-direct API calls
- Access token stored in memory only
- Refresh token handled by HttpOnly cookie
- 401 refresh-and-retry flow in `src/lib/api/httpClient.ts`

## Feature parity targets

- Login
- Add purchase/income
- Statistics events and chart
- User profile and categories

## Local run

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quality gates

- `npm run lint`
- `npm run build`
