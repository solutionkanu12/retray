# ReTray Product Requirements Document

## Goal

Prove a credible reusable-container loop that a food venue can understand in under one minute and a hackathon judge can complete end to end.

## Success criteria

1. A visitor understands that ReTray prevents disposable takeaway packaging before it is used.
2. A venue operator can open the dashboard and begin the flow in one action.
3. A customer can see where to return RT-024 and what happens to the simulated deposit.
4. Confirming the return visibly updates the container status, wash queue, and impact total.
5. Authentication, persisted circulation records, and browser QR detection are real. The product never claims to execute payments, native hardware scanning, or location services.

## Phase A product requirements

- Sites-authenticated users choose a permanent business operator or consumer account type.
- Business operators can create and rename venues, register QR containers, and record issue, return, wash-ready, and washed events.
- Consumers can see only their own borrowed and returned container records.
- Dashboard values are calculated from D1 records.
- Circulation events cannot be updated or deleted.
- Deposit values are ledger-only records and never imply money movement.
- Kora Kitchen, Maya L., RT-024, and EUR 3.00 remain clearly marked seed data.

## Required flow

1. Landing page: user opens the demo.
2. Venue dashboard: Kora Kitchen shows the initial ledger and metrics.
3. Operator selects or scans RT-024.
4. Customer return pass: Maya L. sees RT-024, Kora Kitchen, and EUR 3.00.
5. Return action: a short checking state appears.
6. Success: the simulated deposit release and Ready to wash state appear.
7. Updated dashboard: RT-024 is Ready to wash, containers out is 17, wash queue is 7, packs avoided is 1,285.

## Functional requirements

- Keep loop transitions in a deterministic domain model with tests.
- Enforce operator ownership and consumer record boundaries on the server.
- Focus the page heading after each view change.
- Respect reduced-motion preferences.
- Provide dedicated Privacy Policy and Terms of Service views.
- Keep unknown social links visibly disabled rather than inventing accounts.

## Design requirements

Follow `DESIGN.md` exactly. The interface is editorial and operational, not a generic startup dashboard. No gradients, green eco cliches, glass, glow, bento grids, generated food imagery, or exaggerated claims.

## Hackathon fit

NextStep Hacks 2026 uses the Earth Forward theme. ReTray addresses waste reduction with a direct, visible prevention mechanism, an executable prototype, and a real venue-oriented user flow.
