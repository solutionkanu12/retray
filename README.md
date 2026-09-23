# ReTray

ReTray is a deployed hackathon demonstration of reusable food-packaging infrastructure. It helps food venues issue, recover, wash, and recirculate reusable containers with authenticated Business and Consumer accounts.

The Kora Kitchen demo story remains a labeled fixture:

1. Kora Kitchen issues RT-024 to Maya L.
2. Maya receives a return pass with a refundable EUR 3.00 deposit.
3. Maya returns the container through the QR lifecycle.
4. RT-024 becomes Ready to wash.
5. The venue ledger and impact count update.

## Deployment boundary

The deployed app uses passwordless email links, Google OAuth, Cloudflare D1 persistence, Business and Consumer account scoping, browser QR support, and a manual QR fallback. Browser camera access is requested only after a person starts it.

Paystack integration is TEST mode only. Deposits and refunds use test money, never live settlement. A browser return from Paystack does not change a deposit state. Signed provider webhooks control paid and refunded states.

## Product workspace

- `PROJECT.md`: product context and non-goals
- `PRD.md`: required experience and acceptance criteria
- `MVP.md`: the strict build boundary
- `DESIGN.md`: locked visual and UX system
- `STATUS.md`: current progress and next work
- `SECURITY.md`: authentication, payment, data, and truthfulness boundaries
- `HANDOFF.md`: where to start as a collaborator
- `docs/`: architecture, testing, submission, research, and implementation plan

## Run locally

Requirements: Node.js 22.13 or later and pnpm.

```sh
pnpm install
pnpm dev
```

## Verify

```sh
pnpm lint
pnpm test
pnpm build
```

## Project structure

- `app/` contains the page shell, metadata, and global visual system.
- `components/` contains the landing, authenticated operator and Consumer, scan, and legal views.
- `lib/retray-state.ts` owns the pure circulation reducer.
- `lib/retray-data.ts` owns persisted D1 venue, container, borrow, payment, refund, and circulation operations.
- `tests/` covers authentication, roles, circulation, payments, webhooks, QR support, and landing integrity.

The single editorial photograph is by Ella Olsson on Pexels and is used under the Pexels licence.
