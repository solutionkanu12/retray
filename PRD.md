# ReTray Product Requirements Document

## Goal

Prove a credible reusable-container loop that a food venue can understand in under one minute and a hackathon judge can complete end to end.

## Success criteria

1. A visitor understands that ReTray prevents disposable takeaway packaging before it is used.
2. A venue operator can open the dashboard and begin the flow in one action.
3. A customer can see where to return RT-024 and what happens to the simulated deposit.
4. Confirming the return visibly updates the container status, wash queue, and impact total.
5. The product never claims to execute real payments, scans, accounts, or location services.

## Required flow

1. Landing page: user opens the demo.
2. Venue dashboard: Kora Kitchen shows the initial ledger and metrics.
3. Operator selects or scans RT-024.
4. Customer return pass: Maya L. sees RT-024, Kora Kitchen, and EUR 3.00.
5. Return action: a short checking state appears.
6. Success: the simulated deposit release and Ready to wash state appear.
7. Updated dashboard: RT-024 is Ready to wash, containers out is 17, wash queue is 7, packs avoided is 1,285.

## Functional requirements

- Keep all shared values in one journey model.
- Keep loop transitions in a deterministic reducer with tests.
- Focus the page heading after each view change.
- Respect reduced-motion preferences.
- Provide dedicated Privacy Policy and Terms of Service views.
- Keep unknown social links visibly disabled rather than inventing accounts.

## Design requirements

Follow `DESIGN.md` exactly. The interface is editorial and operational, not a generic startup dashboard. No gradients, green eco cliches, glass, glow, bento grids, generated food imagery, or exaggerated claims.

## Hackathon fit

NextStep Hacks 2026 uses the Earth Forward theme. ReTray addresses waste reduction with a direct, visible prevention mechanism, an executable prototype, and a real venue-oriented user flow.
