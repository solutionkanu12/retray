# ReTray Status

## Current milestone

The ReTray hackathon deployment is available over HTTPS on Cloudflare Workers with persisted production D1 records. It remains a prototype, not a live commercial service.

## Verified

- `pnpm test`: 81 passing tests at the final Task 7 gate
- `pnpm lint`: passing
- `pnpm build`: passing
- `pnpm exec tsc --noEmit`: passing
- Passwordless email verification and sign-in links use 15-minute, single-use token records in production D1
- Google OAuth identities, verified accounts, venues, containers, borrows, and immutable circulation events persist in production D1
- Protected `/app` access redirects unauthenticated visitors to sign-in
- A Paystack TEST payment record is marked paid only with a persisted `charge.success` webhook record
- A Paystack TEST refund record is marked refunded only with one persisted `refund.processed` webhook record and no duplicate payment, refund, or webhook records
- Retained physical-phone evidence confirms HTTPS access, granted and denied camera states, QR resolution, correct lifecycle action display without submission, and manual QR fallback

## Completed

- Locked design system copied to `DESIGN.md`
- HTTPS hackathon deployment prepared from this workspace
- Generic recycle icon replaced with the ReTray mark in the loop proof
- Passwordless email signup and sign-in with D1-backed, HttpOnly sessions and fixed Business and Consumer roles
- D1 schema and migration added for users, venues, containers, borrows, and immutable circulation events
- Operator and consumer dashboards read only their own persisted records; new accounts have no seeded demo data
- Native browser camera scanner added with manual fallback
- Standards-based QR tags generated without adding a dependency
- Google OAuth links a matching existing account rather than creating a duplicate user
- Paystack TEST checkout and eligible refund requests await signed provider webhook outcomes

## Next work

1. Verify the public repository and submission materials before final submission.
2. Add verified social destinations only after the accounts exist.
3. Record the demo video and complete the Devpost submission materials.

## Do not do

Do not add live payments, marketplace features, speculative impact claims, or any feature that prevents the full core flow from working.
