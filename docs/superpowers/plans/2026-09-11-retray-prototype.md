# ReTray Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a polished, truthful, responsive ReTray frontend prototype and the evidence needed to submit it to NextStep Hacks 2026.

**Architecture:** A single React client application owns the complete demo flow. `lib/journey-model.ts` provides shared demo values, `lib/retray-state.ts` provides deterministic state transitions, and presentational components render the landing, venue, customer, success, and legal views.

**Tech Stack:** Next.js-compatible Vinext, React 19, TypeScript, CSS, Lucide icons, Node test runner, ESLint, pnpm.

**Spec:** `DESIGN.md`

## Global Constraints

- Use the exact product truth and user journey in `PROJECT.md` and `MVP.md`.
- No payments, authentication, hardware QR scanning, customer data, or production claims.
- No gradients, glow, glass, green eco cliches, generic recycling icons, or generated food images.
- Test with `pnpm test`, `pnpm lint`, and `pnpm build` after each meaningful implementation task.
- Keep all git commits authored by Solution only.

---

### Task 1: Establish and protect the demo baseline

**Files:**
- Verify: `lib/retray-state.ts`
- Verify: `tests/retray-state.test.ts`
- Verify: `tests/journey-model.test.ts`
- Update: `STATUS.md`

**Interfaces:**
- Consumes: `reduceLoop(state, event)` and `initialLoopState`.
- Produces: a verified baseline where RT-024 moves to `Ready to wash` once only.

- [ ] **Step 1: Run baseline verification**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: nine tests pass, lint passes, build completes.

- [ ] **Step 2: Verify the state transition contract**

Confirm `RETURN_CONFIRMED` changes `containersOut` from 18 to 17, `readyToWash` from 6 to 7, `packsAvoided` from 1284 to 1285, and RT-024 to `Ready to wash`.

- [ ] **Step 3: Record results**

Update `STATUS.md` only if the baseline or test count changes.

### Task 2: Finish locked visual and responsive review

**Files:**
- Verify: `DESIGN.md`
- Modify if needed: `app/globals.css`
- Modify if needed: `components/landing-page.tsx`
- Test: `docs/TESTING.md`

**Interfaces:**
- Consumes: the locked design tokens and landing section IDs.
- Produces: no clipping at 1440px, 768px, or 390px and no forbidden design patterns.

- [ ] **Step 1: Review desktop at 1440px**

Check hero hierarchy, navigation, ledger columns, footer, and the return seam.

- [ ] **Step 2: Review tablet at 768px**

Confirm the hero proof and dashboard metrics reflow without compressed text.

- [ ] **Step 3: Review mobile at 390px**

Confirm no horizontal overflow, 48px minimum primary controls, readable return pass, and usable menu.

- [ ] **Step 4: Implement only concrete defects found**

Use the smallest CSS or component change that corrects the observed issue. Do not redesign the locked system.

- [ ] **Step 5: Re-run verification**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: all commands pass.

### Task 3: Prepare truthful final assets

**Files:**
- Modify if approved: `components/landing-page.tsx`
- Modify if approved: `components/legal-page.tsx`
- Verify: `README.md`
- Verify: `docs/SUBMISSION.md`

**Interfaces:**
- Consumes: an externally licensed, real food-service image and its source credit.
- Produces: one real, properly described editorial photo and clear prototype disclaimers.

- [ ] **Step 1: Select a real photo only**

Use a licensed food-service handoff or reusable takeaway-container photo. Record its provider and creator in the visible caption and legal copy.

- [ ] **Step 2: Preserve truthful customer copy**

Keep the customer flow explicit that the deposit release is simulated and no payment action occurs.

- [ ] **Step 3: Verify source and copy**

Run: `rg -n -i "real payment|processed payment|live scan|city-wide|carbon saved" components app README.md`
Expected: no unsupported production claim.

### Task 4: Make the submission proof

**Files:**
- Update: `docs/SUBMISSION.md`
- Create: `docs/DEMO_SCRIPT.md`
- Verify: `README.md`

**Interfaces:**
- Consumes: working prototype journey and public deployment URL when available.
- Produces: a concise demo script that never overstates functionality.

- [ ] **Step 1: Write the five-minute-or-shorter spoken demo**

Use the six-part structure in `docs/SUBMISSION.md` and show the complete return journey live.

- [ ] **Step 2: Capture required evidence**

Record the landing page, issue flow, return pass, confirmation, and updated dashboard in one continuous video.

- [ ] **Step 3: Final verification**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: all commands pass before deployment and repository submission.
