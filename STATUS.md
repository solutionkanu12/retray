# ReTray Status

## Current milestone

The real-account MVP is implemented locally on the built Cloudflare Worker and D1. It is not a production deployment.

## Verified

- `pnpm test`: 32 passing tests
- `pnpm lint`: passing
- `pnpm build`: passing
- `pnpm exec tsc --noEmit`: passing
- Built Worker verified against local D1 with newly created operator and consumer accounts, issued containers, consumer return, wash-ready, and washed events
- Existing sessions, accounts, and circulation records survived a built Worker restart

## Completed

- Locked design system copied to `DESIGN.md`
- Prototype source prepared in this workspace
- Generic recycle icon replaced with the ReTray mark in the loop proof
- Email/password signup and sign-in with D1-backed, HttpOnly sessions and fixed account roles
- D1 schema and migration added for users, venues, containers, borrows, and immutable circulation events
- Operator and consumer dashboards read only their own persisted records; new accounts have no seeded demo data
- Native browser camera scanner added with manual fallback
- Standards-based QR tags generated without adding a dependency

## Next work

1. Review the live responsive UI at desktop, tablet, and mobile widths.
2. Add a production D1 resource and apply migrations through the hosting control plane.
3. Add email verification, password reset, and login throttling before any public production launch.
4. Add verified social destinations only after the accounts exist.
5. Record the demo video and complete the Devpost submission materials.

## Do not do

Do not add payments, marketplace features, speculative impact claims, or any feature that prevents the full core flow from working.
