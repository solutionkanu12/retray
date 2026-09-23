# ReTray Security and Truthfulness Rules

## Hackathon deployment boundary

ReTray signs up Consumers and Business operators with passwordless email links or Google OAuth. Email links are 15-minute and single-use. Opaque, HttpOnly session cookies map to hashed session tokens in D1, and account actions use the D1 session rather than Sites identity headers. It stores the minimum account identity, venue, container, borrow, payment, refund, and circulation data needed for the product loop. It does not request wallet access or precise location.

Camera access begins only after an operator or consumer selects Start camera. QR frames are decoded in the browser and are not stored as images. A manual QR ID fallback remains available.

## Non-negotiable claims

- New deposit values default to 0. An operator may enter an expected refundable amount at issue.
- Paystack checkout and refunds use TEST mode and test money only. ReTray does not process live payments, hold real funds, or provide financial settlement.
- A browser return never marks a payment paid. Signed Paystack webhooks control paid and refunded states, with stored event digests for duplicate-event protection.
- QR IDs and circulation actions are persisted.
- Kora Kitchen, Maya L., RT-024, and EUR 3.00 are optional demo examples, not records created for new accounts.

## Access and audit rules

- Only a business operator who owns a venue can mutate that venue or its container pool.
- A consumer can read and return only active borrows linked to their authenticated user ID.
- Circulation events are append-only. Database triggers reject update and delete operations.
- Every server action re-reads the authenticated identity and checks ownership.
- Account type is fixed at signup.

Passwordless email verification and sign-in throttling per email and client combination are implemented. Password reset is not applicable because ReTray does not collect passwords. Do not describe this hackathon deployment as production-hardened authentication or a live financial service.
