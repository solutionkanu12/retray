# ReTray Product Requirements Document

## Goal

Prove a credible reusable-container loop that a food venue can understand in under one minute and a hackathon judge can complete end to end.

## Success criteria

1. A visitor understands that ReTray prevents disposable takeaway packaging before it is used.
2. A venue operator can open the dashboard and begin the flow in one action.
3. A customer can see where to return RT-024 and the state of its demo or Paystack TEST deposit.
4. Confirming the return visibly updates the container status, wash queue, and impact total.
5. Passwordless authentication, Google OAuth, persisted circulation records, and browser QR detection are real. Paystack operates in TEST mode with test money only. The product never claims live payment settlement, native hardware scanning, or location services.

## Phase A product requirements

- Users sign up and sign in with passwordless email links or Google OAuth, selecting a permanent Business operator or Consumer account type. Business signup creates its first venue.
- Business operators can create and rename venues, register QR containers, and record issue, return, wash-ready, and washed events.
- Consumers can see and return only their own borrowed containers, by camera QR detection where supported or manual QR payload.
- Dashboard values are calculated from D1 records.
- Circulation events cannot be updated or deleted.
- Deposit values default to 0. Eligible NGN deposits can use Paystack TEST checkout and refund requests with test money. Signed provider webhooks, not a browser return, control paid and refunded states.
- Kora Kitchen, Maya L., RT-024, and EUR 3.00 remain clearly marked optional demo fixtures and never populate a new account by default.

## Landing demo fixture

1. The landing page presents the Kora Kitchen, Maya L., RT-024, and EUR 3.00 fixture.
2. The fixture depicts the container moving from Borrowed to Returned to Ready to wash.
3. View demo opens the protected product at `/app`, where a verified account is required.
4. In the authenticated lifecycle, a return records the container as Returned.
5. A Business operator separately marks a returned container Ready to wash.
6. The fixture's EUR 3.00 deposit release is illustrative. Paystack TEST paid and refunded states are controlled separately by verified provider outcomes.

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
