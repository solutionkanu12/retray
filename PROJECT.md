# ReTray

## Product

ReTray is reusable food-packaging infrastructure for closed-loop food venues such as campuses, food halls, offices, and events. It gives venues one simple operating loop: issue a tagged container, receive it back, wash it, and issue it again.

The customer makes a refundable deposit. The venue pays for the operating software or per-container circulation. The product starts with one venue and one easy return point, then can expand to multi-venue networks.

## Problem

Disposable takeaway packaging is used once because food venues lack a simple way to know which reusable containers are out, back, or waiting for wash. Customers also need a return instruction that is clear enough to follow.

## Product truth

The environmental effect is direct: every successful return enables one reusable container to replace one disposable takeaway pack. Do not claim carbon or water savings. ReTray has browser QR support, persistent production D1 records, and Paystack TEST integration, but it does not process live payments or financial settlement.

## Prototype story

Kora Kitchen issues RT-024 to Maya L. Maya receives a return pass with a EUR 3.00 demo deposit. She scans the return point. The demo confirms the return, marks RT-024 Ready to wash, and updates the venue ledger from 18 to 17 containers out and from 1,284 to 1,285 disposable packs avoided.

## Primary users

- Venue operator: needs to know what is out, what came back, and what needs washing.
- Customer: needs a clear return point, container identity, deposit amount, and confirmation.

## Phase A product foundation

The hackathon deployment uses passwordless email links, Google OAuth, authenticated accounts, and persistent D1 records. Business operators manage venues and container circulation. Consumers see only their own current and returned borrows. Camera QR detection is available in supported browsers with a manual QR ID fallback.

Paystack TEST deposits and refunds use test money only. A browser return does not change a payment state. Signed provider webhooks control paid and refunded states.

## Current non-goals

- Live payment collection, release, or settlement
- Delivery, a marketplace, recycling education, rewards, or city-wide availability
- Native scanning hardware or precise location

## Source of truth

- Product and visual requirements: `DESIGN.md`
- Scope boundary: `MVP.md`
- Current work: `STATUS.md`
- Decisions: `DECISIONS.md`
- Build steps: `docs/superpowers/plans/2026-09-11-retray-prototype.md`
