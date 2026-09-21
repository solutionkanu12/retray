# ReTray Security and Truthfulness Rules

## Phase A boundary

ReTray signs up consumers and business operators with email and password. Passwords are salted and hashed with PBKDF2-SHA-256. Opaque, HttpOnly session cookies map to hashed session tokens in D1, and account actions use the D1 session rather than Sites identity headers. It stores the minimum account identity, venue, container, borrow, and circulation data needed for the product loop. It does not request payment information, wallet access, or location access.

Camera access begins only after an operator or consumer selects Start camera. QR frames are decoded in the browser and are not stored as images. A manual QR ID fallback remains available.

## Non-negotiable claims

- New deposit ledger values default to 0. An operator may enter an expected refundable amount at issue. No money moves.
- QR IDs and circulation actions are persisted.
- Kora Kitchen, Maya L., RT-024, and EUR 3.00 are optional demo examples, not records created for new accounts.
- No transaction is created and no money moves.

## Access and audit rules

- Only a business operator who owns a venue can mutate that venue or its container pool.
- A consumer can read and return only active borrows linked to their authenticated user ID.
- Circulation events are append-only. Database triggers reject update and delete operations.
- Every server action re-reads the authenticated identity and checks ownership.
- Account type is fixed at signup.

Email verification, password reset, and account-level login throttling are not implemented. Do not describe this MVP as production-hardened authentication.
