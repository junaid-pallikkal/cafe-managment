<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Restaurant Operations Management System — Agent Directives

> **System Purpose:** Connect Captain, Kitchen, Billing, and Admin into a seamless, role-based, real-time restaurant operations workflow.  
> **Source Plan:** [restaurant_operations_buildathon_plan.md](file:///d:/BUILDATHON/cafe/restaurant_operations_buildathon_plan.md)  
> **Target Audience:** AI Agents & Developers contributing to this codebase.

---

## 1. Core Operating Principles

1. **Inspect Before Changing:** Always inspect the repository and understand the existing configuration before editing or creating files. Never blow away working code.
2. **Incremental Delivery:** Build one vertical slice at a time. The main branch and dev server must stay runnable and buildable (`npm run build`) after every milestone.
3. **Verify, Never Guess:** Run Prisma commands, TypeScript typechecks, lint, and build commands directly. Never claim a step succeeds without verifying command output.
4. **Server-Authoritative Security & Finance:**
   - Never trust client-submitted prices or totals.
   - All role permissions must be enforced inside Server Actions / Route Handlers on the server. UI element hiding is UX, not security.
   - Financial totals must be computed on the server using Prisma `Decimal` or integer minor units (paise). Never use JavaScript floating-point arithmetic for currency.
   - Payment creation and order status transition to `PAID` must be executed inside an atomic database transaction (`prisma.$transaction`) to prevent duplicate payments or race conditions.
5. **Preserve Next.js Agent Rules:** The `<!-- BEGIN:nextjs-agent-rules -->` block at the top of this file is automatically maintained by Next.js tooling. Do not remove or corrupt it.

---

## 2. Technology Stack & Framework Conventions

| Layer | Technology | Guidelines |
|---|---|---|
| **Framework** | Next.js App Router (16+) + TypeScript | Strict typing. Adhere to Next.js 16 breaking changes: `cookies()`, `headers()`, and dynamic route `params` / `searchParams` are Promises and must be awaited. |
| **Styling** | Tailwind CSS v4 | Use CSS-first theme configuration (`@import "tailwindcss";`), clean utility classes, and avoid bloated arbitrary classes. |
| **Components** | shadcn/ui + Lucide React | Accessible primitives (Radix UI under the hood), modals, toasts, dropdowns, tables, and buttons. |
| **Database** | PostgreSQL | Relational database for orders, line items, payments, users, and financial records. |
| **ORM** | Prisma ORM | Prisma client for strictly typed database operations, migrations, and seed scripts. |
| **Validation** | Zod | Single source of truth for input validation on both client forms and server actions. |
| **Forms** | React Hook Form + `@hookform/resolvers/zod` | Performant form state handling with inline Zod validation. |
| **State & Mutation** | Server Actions & Reusable Services | Business logic lives in `server/services/`, called by Server Actions in `server/actions/`. |

---

## 3. Project Directory Structure

Adhere to this standardized modular directory layout:

```text
cafe/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx               # Login screen
│   ├── (workspace)/
│   │   ├── layout.tsx                   # Shared workspace layout (header, role badge, nav)
│   │   ├── captain/
│   │   │   ├── page.tsx                 # Table grid & active order status
│   │   │   ├── orders/new/page.tsx      # Order creation cart & menu selection
│   │   │   └── orders/[id]/page.tsx     # Order detail & live status
│   │   ├── kitchen/
│   │   │   └── page.tsx                 # Kitchen display system (New, Preparing, Ready)
│   │   ├── billing/
│   │   │   ├── page.tsx                 # Pending bills queue
│   │   │   ├── takeaway/page.tsx        # Fast takeaway order & billing
│   │   │   └── bills/[id]/page.tsx      # Bill checkout, payment, & receipt view
│   │   └── admin/
│   │       ├── page.tsx                 # Today's operational & financial summary
│   │       ├── menu/page.tsx            # Menu category & item management
│   │       ├── tables/page.tsx          # Dining table management
│   │       ├── purchases/page.tsx       # Supplier purchases entry & list
│   │       ├── expenses/page.tsx        # Operating expense entry & list
│   │       ├── reports/page.tsx         # Basic sales & payment reports
│   │       └── staff/page.tsx           # Staff accounts & role assignments
│   ├── api/
│   │   └── health/route.ts              # API health check
│   ├── layout.tsx                       # Root layout & font loading
│   └── globals.css                      # Tailwind v4 theme & global variables
├── components/
│   ├── ui/                              # shadcn/ui primitives (button, dialog, card, etc.)
│   ├── layout/                          # App header, role navigation, status indicators
│   ├── orders/                          # Order cart, table picker, item selectors
│   ├── kitchen/                         # Kitchen order card, item status toggles
│   ├── billing/                         # Checkout calculator, payment modal, receipt preview
│   ├── admin/                           # Financial summary cards, data tables, modals
│   └── shared/                          # Status badges, empty states, loading skeletons
├── lib/
│   ├── auth/                            # Session resolution, password hashing (bcrypt)
│   ├── db.ts                            # PrismaClient singleton instance
│   ├── permissions.ts                   # RBAC helper functions
│   ├── validations/                     # Zod schemas for orders, billing, menu, expenses
│   ├── formatters/                      # Currency (INR/minor units), date & time formatters
│   └── utils.ts                         # cn utility and class merging
├── server/
│   ├── services/                        # Core business logic decoupled from HTTP/actions
│   │   ├── order-service.ts             # Order lifecycle, transitions, price snapshots
│   │   ├── billing-service.ts           # Totals calculation, atomic payment processing
│   │   ├── purchase-service.ts          # Purchase operations
│   │   └── expense-service.ts           # Operating expense operations
│   └── actions/                         # Next.js Server Actions with RBAC & Zod guards
├── prisma/
│   ├── schema.prisma                    # PostgreSQL schema definition
│   └── seed.ts                          # Demo seed data (users, tables, menu categories)
├── tests/
│   ├── unit/                            # Unit tests for calculations, transitions, RBAC
│   └── e2e/                             # End-to-end workflow verification
├── public/
├── .env.example                         # Template environment variables
└── README.md                            # Comprehensive setup & demo documentation
```

---

## 4. Roles & Access Control (RBAC)

### Role Definitions

| Role | Primary Scope | Permitted Operations |
|---|---|---|
| `CAPTAIN` | Dine-in & Takeaway order taking | View tables, create draft orders, submit to kitchen, view preparation status, mark orders served, request bills. |
| `KITCHEN` | Food preparation | View kitchen queue (New, Preparing, Ready), change item status (`QUEUED` → `PREPARING` → `READY`), view item notes/timers. |
| `BILLING` | Cashier & payment settlement | View pending bills, review authoritative totals, record payments, print/download receipts, create & bill takeaway orders. |
| `ADMIN` | Restaurant oversight & financials | View all dashboards, manage tables/menu/staff, record purchases & expenses, inspect sales & audit logs, void/cancel orders with reason. |

### Strict RBAC Rules
- **Server Action Enforcement:** Every server action must begin by extracting the authenticated user session and asserting permission. Never trust client role assertions.
- **Captain Constraints:** Captain cannot mark a bill as `PAID`.
- **Kitchen Constraints:** Kitchen cannot view or modify prices, discounts, or payment statuses. Kitchen cannot delete an order.
- **Billing Constraints:** Billing cannot modify kitchen preparation statuses directly.
- **Financial Immutability:** A paid bill cannot be silently edited. Any correction requires an Admin void/refund action with a documented reason and an audit log entry.
- **Deactivation:** Inactive users (`isActive: false`) must be blocked immediately from performing mutations.

---

## 5. Order State Machine & Integrity

### State Machine Lifecycle

```text
[DRAFT]
   │  (Captain submits)
   ▼
[SENT_TO_KITCHEN]
   │  (Kitchen starts preparation)
   ▼
[PREPARING]
   │  (All active line items marked READY)
   ▼
[READY]
   │  (Captain serves food to customer)
   ▼
[SERVED]
   │  (Captain requests bill)
   ▼
[BILL_REQUESTED]
   │  (Billing settles payment via atomic transaction)
   ▼
[PAID]
```

*Note: Any unpaid order can be transitioned to `CANCELLED` only through an authorized role with a mandatory cancellation reason.*

### Invariants & Business Logic Rules
1. **Item-Level Statuses:** Each `OrderItem` moves through: `QUEUED` → `PREPARING` → `READY` (or `CANCELLED`).
2. **Order Readiness Rule:** An order status transitions to `READY` **only when all non-cancelled order items** are `READY`.
3. **Bill Request Precondition:** In dine-in workflows, `BILL_REQUESTED` must only be triggered once the order is `SERVED` (or takeaway payment policy).
4. **Price Snapshotting:** When an order is submitted to the kitchen, `OrderItem.nameSnapshot` and `OrderItem.unitPrice` must be frozen from the current database `MenuItem` price. Subsequent menu price adjustments must never alter historical bills.
5. **Atomic Payment Settlement:**
   - Inside a single `prisma.$transaction`:
     1. Verify order exists and is in `BILL_REQUESTED` (or valid pending state).
     2. Verify no existing completed payment exists for this order.
     3. Create the `Payment` record with method, amount, cashier ID, and receipt number.
     4. Update `Order.status` to `PAID` with `paidAt` timestamp.
   - If a concurrent cashier attempts to settle the same bill, the transaction must fail gracefully with a descriptive error.
6. **Currency & Totals:**
   - Store prices and amounts using `Decimal` (`@db.Decimal(10, 2)`).
   - Authoritative formula:
     $$\text{Subtotal} = \sum (\text{unitPrice} \times \text{quantity})$$
     $$\text{Total} = \text{Subtotal} - \text{Discount} + \text{Tax} + \text{Service Charge}$$
   - Validate that $\text{Discount} \ge 0$, $\text{Quantity} \ge 1$, and $\text{Subtotal} \ge 0$.

---

## 6. Standardized Server Mutation Pattern

All server actions must follow this consistent flow and return an `ActionResult<T>`:

```typescript
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };
```

### Mutation Checklist:
1. **Authenticate:** Check session / current user via auth helper.
2. **Authorize:** Verify user role is allowed to perform this action.
3. **Validate Input:** Parse payload with the corresponding Zod schema.
4. **Fetch Fresh State:** Read latest authoritative records from PostgreSQL.
5. **Enforce State Invariants:** Check valid status transition or business rules.
6. **Execute in Transaction:** For multi-table writes (orders, line items, payments).
7. **Audit Log:** Record privileged or money-altering actions in `AuditLog`.
8. **Revalidate:** Call `revalidatePath` or `revalidateTag` for reactive screens.
9. **Return Safe Result:** Return `{ success: true, data }` or sanitized `{ success: false, error }`. Never leak database connection strings or stack traces.

---

## 7. UI/UX & Design Guidelines

- **Color Palette:** Professional restaurant POS aesthetic. Use a calm **soft mint / deep emerald green** primary accent system with clean neutral surfaces (slate/zinc) and high contrast typography.
- **Status Indication (Accessibility):** Never communicate status by color alone. Always combine color accents with explicit text labels and Lucide icons:
  - `DRAFT`: Gray
  - `SENT_TO_KITCHEN`: Amber / Orange
  - `PREPARING`: Blue
  - `READY`: Emerald / Green
  - `SERVED`: Teal
  - `BILL_REQUESTED`: Purple
  - `PAID`: Forest Green
  - `CANCELLED`: Rose / Destructive
- **Kitchen Usability:** High contrast, large typography, readable from several feet away. Oldest tickets at the top with elapsed time indicators.
- **Responsive Layout:**
  - Desktop: Persistent side navigation and side checkout cart.
  - Tablet/Mobile: Touch-friendly large targets (minimum 44x44px), compact bottom navigation bar, and bottom sheet for active order carts.
- **Feedback & Confirmation:**
  - Destructive or financial operations (void, cancel, payment submission) must require an explicit confirmation modal.
  - Display non-intrusive toasts for status changes and order creations.
  - Provide skeleton loaders and informative empty states for all queues.

---

## 8. Implementation Milestones

When building or extending this project, execute through the following milestones in strict sequence. Ensure that tests and builds pass before transitioning to the next milestone:

```
[Milestone A: Foundation & Database]
       │
[Milestone B: Auth & RBAC Security]
       │
[Milestone C: Shell, Layout & Dashboards]
       │
[Milestone D: Captain Order Creation]
       │
[Milestone E: Kitchen Display System]
       │
[Milestone F: Service & Bill Request]
       │
[Milestone G: Billing Checkout & Payments]
       │
[Milestone H: Admin Finance & Inventory Operations]
       │
[Milestone I: Verification, Testing & Polish]
```

### Detailed Milestone Checklist:

- [ ] **Milestone A — Foundation, Environment & Database:**
  - Configure `.env.example` and environment validation.
  - Setup Prisma schema with `User`, `DiningTable`, `MenuCategory`, `MenuItem`, `Order`, `OrderItem`, `Payment`, `Purchase`, `Expense`, and `AuditLog`.
  - Validate schema with `npx prisma validate` and run migrations.
  - Implement `prisma/seed.ts` containing default tables, menu categories, menu items, and demo users.
- [ ] **Milestone B — Authentication & RBAC Route Protection:**
  - Session handling with secure cookies and password hashing.
  - Login page with role-aware redirection.
  - Middleware and server action guards for `ADMIN`, `CAPTAIN`, `KITCHEN`, `BILLING`.
- [ ] **Milestone C — Shared App Shell & Navigation:**
  - Workspace layout with restaurant branding, role badge, user profile, and active shift header.
  - Role-specific navigation items.
- [ ] **Milestone D — Captain Order Creation:**
  - Table selection grid displaying occupancy status.
  - Categorized menu item browser with search and quick-add controls.
  - Order cart with item notes, quantity adjusters, and server-side submission to kitchen.
- [ ] **Milestone E — Kitchen Display System (KDS):**
  - Live kitchen queue partitioned into `New`, `Preparing`, and `Ready`.
  - Item-level preparation toggles and order completion.
  - Elapsed order timer and special preparation notes display.
- [ ] **Milestone F — Ready Status & Bill Request Flow:**
  - Captain view displaying orders ready for service.
  - "Mark as Served" action.
  - "Request Bill" action to transition order to billing queue.
- [ ] **Milestone G — Billing Checkout & Atomic Payments:**
  - Pending bill queue for cashiers.
  - Itemized checkout summary calculating subtotal, discounts, and taxes from database snapshots.
  - Atomic payment settlement supporting Cash, UPI, Card, and Other.
  - Printable receipt modal and receipt formatting stylesheet.
- [ ] **Milestone H — Admin Finance & Operational Summary:**
  - Dashboard displaying today's gross sales, open orders, pending bills, and recorded expenses.
  - Purchase record management (vendor, invoice ref, category, amount).
  - Operating expense entry (rent, utilities, ingredients, salaries).
  - Basic reporting and menu/table management.
- [ ] **Milestone I — Verification, Tests & Polish:**
  - Unit tests for order state transitions, role permissions, and price calculations.
  - Polling or realtime status synchronization.
  - Verification of responsive layouts on mobile, tablet, and desktop viewports.
  - Successful execution of `npm run lint` and `npm run build`.

---

## 9. Demo Accounts & Seed Data Reference

During evaluation, judging, or manual testing, utilize the following seeded credentials:

| Role | Username / Email | Default Password | Initial View |
|---|---|---|---|
| **Admin** | `admin.demo` / `admin@restaurant.demo` | `DemoPass123!` | `/admin` |
| **Captain** | `captain.demo` / `captain@restaurant.demo` | `DemoPass123!` | `/captain` |
| **Kitchen** | `kitchen.demo` / `kitchen@restaurant.demo` | `DemoPass123!` | `/kitchen` |
| **Billing** | `billing.demo` / `billing@restaurant.demo` | `DemoPass123!` | `/billing` |

*Note: Demo passwords must be properly hashed via the seed script (`prisma/seed.ts`). Never hardcode or display unhashed passwords in client bundles.*

---

## 10. Agent Verification Commands

Before concluding any major code change, run and verify the following commands from `d:\BUILDATHON\cafe` (use `npm.cmd` / `npx.cmd` in Windows PowerShell if `.ps1` execution is restricted):

```powershell
# Format and validate Prisma schema
npx.cmd prisma validate

# Type check TypeScript codebase
npx.cmd tsc --noEmit

# Run ESLint
npm.cmd run lint

# Run Next.js production build
npm.cmd run build
```


<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Ignore routine debugging and unverified changes. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Keep a qualifying candidate through the reporting pass even if you resolve or work around it. A successful fix changes the report outcome; it does not erase the friction that qualified it.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `node node_modules/next/dist/bin/next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
