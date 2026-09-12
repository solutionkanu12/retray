# ReTray Design System

Version: 1.0  
Status: Locked for prototype review  
Reference: Hex design system supplied by the user

## Product truth

ReTray is operating infrastructure for reusable food packaging. It helps a venue issue a QR-tagged container with a refundable customer deposit, receive the container back, release the deposit, and move the container into washing and recirculation.

ReTray is not a recycling app, delivery product, marketplace, payments product, or consumer rewards scheme. Its environmental value is direct: each successful circulation prevents a disposable takeaway pack from being used.

The prototype proves one complete loop:

1. Kora Kitchen issues container RT-024.
2. Maya L. receives a return pass showing a EUR 3.00 refundable deposit.
3. Maya scans a return point.
4. The return is confirmed and the deposit is released.
5. RT-024 becomes Ready to wash in the venue ledger.
6. The venue impact count increases.

No copy may imply real payments, authentication, hardware scanning, city-wide availability, or production integrations.

## Primary users

### Venue operator

Needs to know what is currently borrowed, what has returned, what needs washing, and whether the reusable-container pool is moving.

Primary action: Scan container.

### Customer

Needs one clear return instruction, the container identity, the deposit amount, and confirmation that the return completed.

Primary action: Scan return point.

## Named aesthetic direction

### The Returning Tray

A calm editorial operating system with a deep charcoal canvas and warm rose action surfaces. The visual identity comes from a container returning into a precise circulation line. It should feel established, human, and operational rather than playful, green-coded, or experimental.

The memorable product device is the return seam: a thin line that leaves a tray, bends once, and visibly reconnects with the loop. It appears in the logo, hero proof, return progress, and success state. It is functional, never floating decoration.

## Brand identity

### Wordmark

Name: ReTray  
Capitalization: ReTray  
Voice: calm, specific, human, globally legible

### Symbol

Use an abstract shallow tray outline with a single returning path that reconnects with the upper edge. The path should imply circulation without copying the universal recycling arrows.

The symbol must:

- Remain recognizable at 16px and 32px.
- Work in one colour.
- Work independently as the favicon.
- Avoid letterforms, leaves, globes, recycling triangles, arrows in a circle, utensils, and generic sustainability icons.

### Core statements

Primary landing headline: The takeaway pack that comes back.

Supporting copy: ReTray helps food venues issue, recover, wash, and recirculate reusable containers without losing track of the loop.

Environmental band: Waste prevented before it exists.

Final CTA: Keep every container in motion.

## Colour system

No gradients. No glow. No pure white or pure black.

| Token | Value | Role |
| --- | --- | --- |
| `--canvas` | `#14141C` | Main dark page and app background |
| `--surface` | `#1B1B24` | Primary dark interface surface |
| `--surface-raised` | `#22222C` | Elevated control and dashboard surface |
| `--surface-inset` | `#101017` | Inset ledger and scan surfaces |
| `--rose` | `#E3B2B3` | Primary action and brand accent |
| `--rose-hover` | `#ECC1C2` | Primary hover state |
| `--rose-pressed` | `#CD999B` | Primary pressed state |
| `--rose-light` | `#F5C0C0` | Full-width light editorial band |
| `--ink` | `#F8F4F4` | Primary text on dark |
| `--ink-soft` | `#D8D1D4` | Supporting text on dark |
| `--muted` | `#98909B` | Metadata and secondary labels |
| `--dark-ink` | `#201B20` | Primary text on rose-light |
| `--dark-soft` | `#594B52` | Supporting text on rose-light |
| `--separator` | `#35343E` | Dark-surface hairlines |
| `--separator-light` | `#C69A9C` | Light-band hairlines |
| `--focus` | `#F5C0C0` | Focus-visible ring on dark |
| `--focus-dark` | `#31263B` | Focus-visible ring on light |
| `--selection` | `#E3B2B3` | Active selections |
| `--success-surface` | `#E3B2B3` | Return success emphasis without adding green |
| `--warning-surface` | `#F5C0C0` | Overdue or attention surface without adding orange |

Status must never rely on colour alone. Every state includes a word label and an icon.

## Typography

The supplied Hex reference uses unavailable proprietary display fonts. Use a buildable editorial equivalent rather than faking them.

Display and narrative: Fraunces, serif.  
Body and interface: IBM Plex Sans, sans-serif.

| Role | Size | Weight | Line height |
| --- | --- | --- | --- |
| Hero display | `clamp(52px, 7vw, 96px)` | 300 | 0.96 |
| Section display | `clamp(42px, 5vw, 68px)` | 300 | 1.02 |
| App page title | `clamp(36px, 4vw, 56px)` | 400 | 1.04 |
| Heading large | 32px | 500 | 1.15 |
| Heading medium | 22px | 600 | 1.25 |
| Body large | 19px | 400 | 1.6 |
| Body | 16px | 400 | 1.6 |
| UI label | 14px | 600 | 1.4 |
| Metadata | 12px | 500 | 1.4 |

Headlines use sentence case. Product copy never uses exclamation marks, emojis, em dashes, en dashes, empty hype, or robotic climate language.

## Grid and spacing

Maximum public-page content width: 1280px.  
Maximum app content width: 1180px.  
Desktop gutters: 48px.  
Tablet gutters: 32px.  
Mobile gutters: 20px.

Base spacing unit: 8px. Half step: 4px.

Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128.

Space inside components is smaller than space between components. Section spacing varies by narrative importance and never creates a repeated card-grid rhythm.

## Geometry and elevation

| Role | Radius |
| --- | --- |
| Primary and outline buttons | 2px |
| Compact controls | 4px |
| Inputs and scan frame | 6px |
| Featured product surface | 8px |
| Pills used only for compact status | 999px |

Use whitespace first, tonal surface changes second, a hairline third, and shadow only for a genuinely elevated surface.

Featured shadow: `0 1px 0 rgba(248,244,244,0.08), 0 18px 40px rgba(5,5,9,0.22)`.

Do not use oversized rounded cards, nested cards, glass, overlays, bento grids, or identical bordered boxes for every section.

## Iconography

Use one coherent outline icon family for common actions and states. Use the custom ReTray symbol only for product identity and loop-specific moments.

Icons use 1.75px to 2px strokes, square optical bounds, and simple geometry. No emoji.

Required icons include scan, container, return, wash, receipt, check, location, arrow, menu, GitHub, X, and email.

## Motion grammar

Motion explains state change and provides feedback. It does not decorate the interface.

| Motion | Duration | Easing | Purpose |
| --- | --- | --- | --- |
| Button colour and border | 160ms | ease | Hover and focus feedback |
| Button translation | 160ms | ease-out | Maximum `translateY(-2px)` on hover |
| Button press | 110ms | ease-out | `translateY(0)` and optional `scale(0.98)` |
| Menu enter | 200ms | cubic-bezier(0.23,1,0.32,1) | Spatial continuity |
| View transition | 240ms | cubic-bezier(0.23,1,0.32,1) | Landing to app and app state change |
| Return seam progress | 700ms | ease-in-out | Explain the return path once |
| Success confirmation | 260ms | ease-out | Reveal the completed return |

Hover effects apply only inside `@media (hover: hover) and (pointer: fine)`.

Buttons must visibly react on hover through colour, border tone, underline, or no more than 2px translation. Never enlarge a button on hover. All motion must stop or reduce under `prefers-reduced-motion`.

## Shared components

### Primary button

48px minimum height, rose fill, dark text, 2px radius, 20px horizontal padding. Hover uses rose-hover and `translateY(-2px)`. Active returns to the baseline and uses rose-pressed. Focus uses a 3px focus ring. Disabled uses 40 percent opacity and no translation.

### Secondary button

48px minimum height, transparent dark or light surface, 1px hairline border. Hover changes the surface and border tone. Active changes opacity. It is never a generic floating white pill.

### Text link

44px touch area. Underline animates from left to right on hover. Focus ring remains visible.

### Navigation

72px desktop height and 64px mobile height. Sticky on the landing page. Dark canvas with an opaque surface and hairline bottom border. No blur or glass. Desktop shows anchor links and View demo. Mobile shows the symbol, wordmark, View demo, and a menu toggle.

### Metric

Metrics are typographic ledger entries, not cards. Each has a plain label, large value, and one factual note. Three metrics are permitted here because they are specifically required operational measures, not marketing feature cards.

### Container ledger

Full-width row system with column headers on desktop and semantic stacked rows on mobile. Every row includes container ID, customer, state, and latest event. Hover highlights the entire row without lifting it.

### Scan panel

Dedicated focused action surface. It shows the scanning frame, the selected container, one primary button, and a short status line. QR geometry is functional and high contrast, not a decorative background.

### Return pass

Customer-first narrow surface with venue, container identity, deposit, return instruction, QR action, and a single primary button. It must read easily on a phone at arm's length.

### Success state

Large return-seam symbol, direct confirmation, deposit amount, container identity, and a plain explanation that the container has re-entered the loop. One action returns to the operator view.

### Footer

Brand statement, Privacy Policy, Terms of Service, GitHub, X, and email icons. Unknown destinations remain clearly non-functional rather than pointing to invented accounts.

## Landing page

The public page is editorial and product-led. It uses alternating charcoal and pale-rose bands with different compositions.

### 1. Navigation

Sticky dark navigation. Anchor links: How it works, For venues, Impact. Primary action: View demo.

### 2. Hero

Asymmetric split composition. Left side carries the headline and concise explanation. Right side shows a live circulation proof where RT-024 moves from Borrowed to Returned to Ready to wash. Primary action: See the live flow. Secondary action scrolls to the loop explanation.

### 3. Environmental statement band

Full-width pale-rose band with the direct line Waste prevented before it exists. Supporting text explains that the best disposable pack is the one a venue never needs to buy.

### 4. How the return loop works

Do not use four matching cards or a horizontal numbered strip. Use one continuous vertical circulation line with four distinct verbs: Borrow, Enjoy, Return, Reuse. Each state changes the same container instead of introducing new illustrations.

### 5. Real-life return story

One real food-service photograph beside a compact narrative following Maya and container RT-024 at Kora Kitchen. The image must show believable reusable takeaway packaging or a real food-service handoff. No generated food, fake eco props, or generic smiling-team photography.

### 6. Venue operator benefits

Use an operator ledger composition. Show how ReTray answers three questions: What is out, what came back, and what needs washing. Do not use a feature-card grid.

### 7. Impact

Tie impact directly to circulation. Show 1 returned container, 1 disposable pack avoided, and 1 container ready to reuse. Avoid speculative carbon or water claims.

### 8. Final CTA

Dark editorial close with the line Keep every container in motion and a View demo button.

### 9. Footer

Legal and social destinations with no invented company information.

## Venue dashboard

User question: What is moving through the loop right now?

Header contains the ReTray logo, Kora Kitchen venue switcher, and operator name Jordan Kim.

Primary message: Your loop is moving.

Required metrics:

- Containers out: 18 before return, 17 after return.
- Ready to wash: 6 before return, 7 after return.
- Disposable packs avoided: 1,284 before return, 1,285 after return.

Required initial ledger:

- RT-024, Maya L., Borrowed, Today 12:42.
- RT-091, Daniel R., Returned, Today 12:31.
- RT-063, Ava K., Ready to wash, Today 12:18.

Primary action: Scan container.

Selecting RT-024 or completing the issue scan opens Maya's customer return pass. The prototype clearly labels the simulation as a demo where needed.

## Customer return pass

User question: Where do I return this, and what happens to my deposit?

Headline: Bring this back to Kora Kitchen.

Primary supporting line: Your EUR 3.00 deposit is waiting.

Show RT-024, borrowed today at 12:42, Kora Kitchen, return status, a clean QR block, and the Scan return point action.

The primary action enters a short checking state, then opens return success. Execution remains entirely simulated.

## Return success

User question: Did the return complete?

Headline: Returned. Nice one.

Supporting line: Your deposit has been released.

Show EUR 3.00 released, RT-024, returned to Kora Kitchen, and Container status: Ready to wash.

The final explanation reads: RT-024 is back in the loop. Kora Kitchen can wash it and issue it again.

Returning to the venue dashboard must update the metrics and RT-024 ledger state.

## Legal surfaces

Privacy Policy and Terms of Service are dedicated readable surfaces with a narrow text measure. Their copy must clearly state that the prototype does not process real payments, identity, QR scans, or customer data.

## Responsive behaviour

### Desktop

Use a maximum 1280px container. Hero uses an asymmetric two-column split. Dashboard metrics share one ledger row. Container ledger retains columns.

### Tablet

Hero proof moves below the statement. Dashboard metrics become a two-row typographic layout. The ledger preserves container and status while moving timestamps into secondary text.

### Mobile

Use 20px gutters. Navigation collapses. Headline is 48px to 56px. Customer return pass becomes the dominant full-width surface. The venue ledger becomes readable stacked entries rather than a squeezed table. Primary actions stay at least 48px high and span the available width where useful. No horizontal scrolling.

## Interaction and system states

Required states:

- Landing navigation closed and open.
- Dashboard before return and after return.
- Container scan idle and selected.
- Return pass active.
- Return scan checking.
- Return success.
- Legal surfaces.
- Disabled footer social destinations when exact URLs are unavailable.
- Reduced-motion mode.

## Forbidden patterns

- Gradients of any kind.
- Green eco palettes, leaves, recycling imagery, or planet clichés.
- Pure white or pure black.
- Glassmorphism, blur, glow, neon, cyberpunk, or floating effects.
- Generic dashboard templates, bento grids, or dense enterprise analytics.
- Exactly three marketing feature cards.
- Large blocks of filler copy.
- Huge rounded cards or repeated 16px to 24px radii.
- Hover enlargement.
- Decorative illustrations made from HTML or hand-written SVG.
- AI-generated or fake-looking food imagery.
- Emojis, exclamation marks, em dashes, or en dashes in product copy.
- Letter-only logo or favicon.
- Claims about measured carbon, water, revenue, real payments, or live city networks.

## Acceptance criteria

- The landing page contains all nine required sections.
- The hero communicates the product mechanism without hackathon framing.
- A venue operator can begin the live flow in one click from the landing page.
- The complete journey works: dashboard, customer pass, scan, success, updated dashboard.
- RT-024 and the EUR 3.00 deposit remain consistent throughout.
- The operator ledger and metrics visibly update after return.
- The environmental proof is exactly one prevented disposable pack per completed return.
- The real food-service image loads and has truthful alt text.
- Privacy Policy and Terms of Service are reachable from the footer.
- GitHub, X, and email icons are present without invented destinations.
- All buttons have hover, focus, active, disabled, and touch states.
- No button enlarges on hover.
- Desktop, tablet, and mobile layouts have no clipping or horizontal overflow.
- Keyboard order, visible focus, status announcements, and reduced-motion preferences are respected.
- No forbidden visual or copy pattern appears.
