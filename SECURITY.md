# ReTray Security and Truthfulness Rules

## Phase A boundary

ReTray authenticates through the Sites identity headers and stores the minimum account identity, venue, container, borrow, and circulation data needed for the product loop. It does not request payment information, wallet access, or location access.

Camera access begins only after an operator selects Start camera. QR frames are decoded in the browser and are not stored as images. A manual QR ID fallback remains available.

## Non-negotiable claims

- Deposit values and statuses are ledger records only. No money moves.
- QR IDs and circulation actions are persisted.
- Kora Kitchen, Maya L., RT-024, and EUR 3.00 are seeded records marked as demo data.
- No transaction is created and no money moves.

## Access and audit rules

- Only a business operator who owns a venue can mutate that venue or its container pool.
- A consumer can read only borrows linked to their authenticated user ID.
- Circulation events are append-only. Database triggers reject update and delete operations.
- Every server action re-reads the authenticated identity and checks ownership.
- Account type cannot be changed after onboarding.
