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
- `lib/retray-state.ts`: loop state and deterministic transitions
- `lib/journey-model.ts`: shared return data and input validation
- `components/landing-page.tsx`: public narrative and all landing sections
- `components/venue-dashboard.tsx`: operator view
- `components/return-pass.tsx`: customer return view
- `components/return-success.tsx`: success confirmation
- `app/globals.css`: locked visual system implementation
- `tests/`: journey, navigation, and reducer coverage

## Required verification

Run `pnpm test`, `pnpm lint`, and `pnpm build` after every meaningful change. Then manually test desktop, tablet, and mobile viewports, including the full return journey.
