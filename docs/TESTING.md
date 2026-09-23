# Testing Checklist

## Automated

```sh
pnpm test
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## Manual journey

1. Open the HTTPS landing page and select View demo.
2. Create or use a verified Business account, then create a venue and register a container.
3. Issue the container to a verified Consumer with a deposit amount when appropriate.
4. In the Consumer account, verify that only its own borrow appears.
5. Return the active container with a browser QR scan where supported or the manual QR fallback.
6. Confirm the Business ledger shows the returned state and the Consumer sees the matching return state.
7. For Paystack TEST only, verify that browser return leaves a payment pending until a signed `charge.success` webhook is processed.
8. Request a refund only for an eligible paid and returned TEST deposit, then retain the signed provider outcome before claiming a refund.

## Responsive checks

- Desktop: 1440px
- Tablet: 768px
- Mobile: 390px
- No horizontal scroll, clipped copy, unreachable controls, or overlapping navigation.
- Keyboard focus is visible and follows the flow.
- Enable reduced motion and confirm view changes do not force smooth scrolling.
- Retain evidence for HTTPS mobile access, granted and denied camera permission, successful QR resolution, and manual QR fallback before claiming phone-camera proof.
