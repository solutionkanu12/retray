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
- `app/app/page.tsx`: authenticated operator and consumer product entry
- `app/app/actions.ts`: authenticated server mutations
- `lib/retray-data.ts`: D1 queries, ownership checks, and circulation writes
- `lib/circulation-domain.ts`: transition and access rules
- `lib/qr-code.ts`: dependency-free QR SVG encoder
- `db/schema.ts`: persisted Phase A data model
- `db/bootstrap.ts`: idempotent local D1 setup and demo seed
- `drizzle/0000_lucky_namora.sql`: deployable schema, immutable-event triggers, and demo seed
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
