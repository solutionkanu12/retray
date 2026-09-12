# ReTray prototype

ReTray is global reusable food-packaging infrastructure. This frontend prototype shows one complete and believable circulation:

1. Kora Kitchen issues RT-024 to Maya L.
2. Maya receives a return pass with a refundable EUR 3.00 deposit.
3. Maya scans the return point.
4. The simulated deposit is released.
5. RT-024 becomes Ready to wash.
6. The venue ledger and impact count update.

No real payment, identity, QR scanner, customer data, or hardware integration is used.

## Product workspace

- `PROJECT.md`: product context and non-goals
- `PRD.md`: required experience and acceptance criteria
- `MVP.md`: the strict build boundary
- `DESIGN.md`: locked visual and UX system
- `STATUS.md`: current progress and next work
- `SECURITY.md`: prototype truthfulness and future production boundaries
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
- `components/` contains the landing, operator, scan, customer, success, and legal views.
- `lib/retray-state.ts` owns the pure circulation reducer.
- `lib/journey-model.ts` owns the shared return contract and page-tool input validation.
- `tests/` covers navigation integrity and the full return state transition.

The single editorial photograph is by Ella Olsson on Pexels and is used under the Pexels licence.
