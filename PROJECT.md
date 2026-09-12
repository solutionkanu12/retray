# ReTray

## Product

ReTray is reusable food-packaging infrastructure for closed-loop food venues such as campuses, food halls, offices, and events. It gives venues one simple operating loop: issue a tagged container, receive it back, wash it, and issue it again.

The customer makes a refundable deposit. The venue pays for the operating software or per-container circulation. The product starts with one venue and one easy return point, then can expand to multi-venue networks.

## Problem

Disposable takeaway packaging is used once because food venues lack a simple way to know which reusable containers are out, back, or waiting for wash. Customers also need a return instruction that is clear enough to follow.

## Product truth

The environmental effect is direct: every successful return enables one reusable container to replace one disposable takeaway pack. Do not claim carbon, water, payment processing, live scanning, or production integrations until they exist.

## Prototype story

Kora Kitchen issues RT-024 to Maya L. Maya receives a return pass with a simulated EUR 3.00 deposit. She scans the return point. The prototype confirms the return, marks RT-024 Ready to wash, and updates the venue ledger from 18 to 17 containers out and from 1,284 to 1,285 disposable packs avoided.

## Primary users

- Venue operator: needs to know what is out, what came back, and what needs washing.
- Customer: needs a clear return point, container identity, deposit amount, and confirmation.

## Non-goals for this prototype

- Real payment collection or release
- Authentication or personal data collection
- Hardware QR integration
- Delivery, a marketplace, recycling education, rewards, or city-wide availability

## Source of truth

- Product and visual requirements: `DESIGN.md`
- Scope boundary: `MVP.md`
- Current work: `STATUS.md`
- Decisions: `DECISIONS.md`
- Build steps: `docs/superpowers/plans/2026-09-11-retray-prototype.md`
