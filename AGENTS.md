# Sanctuary Hub — Agent Instructions

## Project overview
Full-stack Diablo 4 community platform. Monorepo with Next.js web app and Expo mobile app.

## Architecture rules
- Backend API lives in `apps/web/app/api/` as Next.js Route Handlers
- Web UI uses Next.js Server Components + Server Actions for data fetching
- Mobile app communicates ONLY via REST API endpoints (never Server Actions)
- All shared DB logic lives in `packages/db` — never duplicate schema elsewhere

## Database rules
- ALWAYS use Drizzle migrations for schema changes: never `ALTER TABLE` manually
- Run `npm run db:generate` after schema changes, then `npm run db:migrate`
- Use Drizzle query builder (`db.select().from()...`) — never raw SQL unless absolutely necessary
- Always use cursor-based pagination for lists — never offset pagination
- Default page size: 20 items

## Authentication rules
- JWT tokens stored in httpOnly cookies on web
- Mobile app stores JWT in SecureStore
- Always check auth in API routes using the `verifyToken()` helper
- Role checks: use the `requireRole()` middleware helper

## Code conventions
- All API routes return `{ data, error, meta }` shape
- Use Zod for all input validation in API routes
- Keep business logic in `services/` files, not in route handlers
- TypeScript strict mode — no `any` types

## File structure
```
apps/web/app/
  api/           ← REST API routes (used by mobile + server actions)
  (auth)/        ← login, register pages
  (main)/        ← protected pages
  admin/         ← admin panel
apps/web/lib/
  auth.ts        ← JWT helpers
  db.ts          ← db client singleton
  services/      ← business logic
apps/mobile/app/ ← Expo Router screens
```
