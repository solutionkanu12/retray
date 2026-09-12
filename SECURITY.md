# ReTray Security and Truthfulness Rules

## Prototype boundary

This is a frontend demonstration. It must not request personal information, payment information, wallet access, camera access, or location access.

## Non-negotiable claims

- Deposit holds and releases are simulated.
- QR actions are simulated.
- Names, venues, times, and container records are demo data stored in the interface.
- No transaction is created and no money moves.

## Future production boundary

When a backend is added, a venue must only see its own container pool and customers must not access operator records. Payment events, return events, and manual overrides need an auditable event log. Do not add any backend until these access and audit rules are designed.
