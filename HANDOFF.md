# ReTray Handoff

## Start here

Read in this order:

1. `PROJECT.md`
2. `MVP.md`
3. `DESIGN.md`
4. `PRD.md`
5. `STATUS.md`
6. `SECURITY.md`

## Important code locations

- `components/retray-app.tsx`: view orchestration and the demo actions
- `app/sign-up/page.tsx`, `app/sign-in/page.tsx`, `app/api/auth/`: account entry and session routes
- `lib/auth-data.ts`, `lib/auth-core.ts`, `lib/auth-session.ts`: D1 accounts, password hashing, and sessions
- `app/app/page.tsx`: session-authenticated operator and consumer product entry
- `app/app/actions.ts`: authenticated server mutations
- `lib/retray-data.ts`: D1 queries, ownership checks, and circulation writes
- `lib/circulation-domain.ts`: transition and access rules
- `lib/qr-code.ts`: dependency-free QR SVG encoder
- `db/schema.ts`: persisted Phase A data model
- `db/bootstrap.ts`: idempotent D1 setup without automatic demo records
- `drizzle/0000_lucky_namora.sql`, `drizzle/0001_nervous_sally_floyd.sql`: deployable schema, credentials, sessions, and immutable-event triggers
- `lib/retray-state.ts`: loop state and deterministic transitions
- `lib/journey-model.ts`: shared return data and input validation
- `components/landing-page.tsx`: public narrative and all landing sections
- `components/venue-dashboard.tsx`: operator view
- `components/return-pass.tsx`: customer return view
- `components/return-success.tsx`: success confirmation
- `app/globals.css`: locked visual system implementation
- `tests/`: journey, navigation, and reducer coverage

## Required verification

Run `pnpm test`, `pnpm lint`, and `pnpm build` after every meaningful change. Then test both account types and the full issue, return, wash-ready, wash, and re-issue journey.
