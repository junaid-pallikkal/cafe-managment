# Emerald Restaurant Operations Management System

> **A real-time, role-based restaurant operations platform connecting Captain, Kitchen, Billing, and Admin into a seamless workflow.**

Built for the Restaurant Operations Buildathon following the detailed architecture plan in [`restaurant_operations_buildathon_plan.md`](./restaurant_operations_buildathon_plan.md).

---

## 🌟 Product Highlights & Workflows

1. **Captain (Floor Order Taking & Service):**
   - Live visual dining table occupancy grid (Available, Occupied, Ready, Served, Bill Requested).
   - Categorized menu item browser with instant live search and quick "+ Add" controls.
   - Fixed desktop cart and mobile responsive ticket builder with line-item cooking notes.
   - Authoritative server-side price snapshots preventing menu price drift.
   - One-tap "Mark as Served" and "Request Bill" actions.

2. **Kitchen Display System (KDS):**
   - High-contrast, large-typography station display readable from across the kitchen.
   - Live tickets sorted oldest-first with elapsed time indicators and special preparation notes.
   - Item-level preparation progress (`QUEUED` → `PREPARING` → `READY`).
   - Order Readiness Invariant: ticket status transitions to `READY` **only when all active items are ready**.
   - Automatic 8-second polling sync with visible live pulse indicator.

3. **Cashier & Billing Settlement:**
   - Real-time pending bill queue populated immediately upon Captain bill requests.
   - Server-authoritative checkout totals (Subtotal, 5% GST tax, discounts, grand total).
   - Atomic payment settlement within a single database transaction (`prisma.$transaction`).
   - Duplicate payment prevention and race condition guards.
   - Multi-channel payments (Cash with change calculator, UPI / QR, Card POS, Other).
   - Printable thermal tax invoice/receipt with 80mm print stylesheet.
   - Fast Takeaway ordering and direct counter settlement.

4. **Admin Management & Financial Overview:**
   - Real-time shift dashboard: gross paid sales, open tickets breakdown, supplier purchases, and operating expenses.
   - Estimated Net Operating figure: $\text{Sales} - (\text{Purchases} + \text{Expenses})$.
   - Supplier Purchases entry (vendor, invoice ref, category, quantity, unit, amount).
   - Operating Expense ledger (rent, utilities, salaries, maintenance, packaging).
   - Menu catalog management with instant stock availability toggles.
   - Dining table layout and capacity manager.
   - Staff accounts management with instant deactivation controls.
   - System audit trail logging all money-altering and sensitive operations.

---

## 🛠 Technology Stack

- **Framework:** Next.js 16 (App Router) + TypeScript (Strict)
- **Styling:** Tailwind CSS v4 (Soft mint / deep emerald restaurant theme)
- **Database & ORM:** PostgreSQL + Prisma ORM 6.4.1
- **Authentication & RBAC:** Secure HTTP-only cookies, signed JWTs via `jose`, `bcryptjs` password hashing
- **Validation:** Zod schemas for all client forms and server actions
- **Icons & UI Primitives:** Lucide React, Radix UI-inspired accessible components
- **Testing:** Node.js native test runner + `tsx`

---

## 👥 Demo User Accounts (Seeded)

For evaluators and judges, the login screen includes **1-click quick-fill buttons** for each role:

| Workstation Role | Email / Username | Password | Default Workspace | Primary Permitted Scope |
|---|---|---|---|---|
| **Captain** | `captain@restaurant.demo` | `DemoPass123!` | `/captain` | Take dine-in/takeaway orders, mark food served, request bill |
| **Kitchen** | `kitchen@restaurant.demo` | `DemoPass123!` | `/kitchen` | View live queue, toggle items to Preparing and Ready |
| **Billing** | `billing@restaurant.demo` | `DemoPass123!` | `/billing` | Settle pending bills, print receipts, takeaway billing |
| **Admin** | `admin@restaurant.demo` | `DemoPass123!` | `/admin` | Financial summary, purchases, expenses, menu & staff management |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18.18+ (tested on Node v24.19)
- PostgreSQL database (Local, Supabase, Neon, or Railway)

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `.env` with your PostgreSQL connection URL:
```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/restaurant_ops?schema=public"
AUTH_SECRET="restaurant-ops-buildathon-super-secret-key-2026-min-32-chars"
APP_URL="http://localhost:3000"
```

### 3. Run Migrations & Seed Data
```bash
# Push schema or run migrations
npm run db:push

# Seed tables, categorized menu items, and demo staff accounts
npm run db:seed
```

### 4. Start the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Quality Checks

Run the verification suite from the project root:

```powershell
# 1. Format and validate Prisma schema
npm run db:validate

# 2. Strict TypeScript type check
npx tsc --noEmit

# 3. ESLint verification
npm run lint

# 4. Unit test suite (pricing, transitions, RBAC)
npm test

# 5. Next.js production build
npm run build
```

---

## 🔄 Order State Machine

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
   │  (Cashier settles payment via atomic transaction)
   ▼
[PAID]
```

*Note: Any unpaid order can be transitioned to `CANCELLED` with a mandatory reason, recorded in the audit trail.*

---

## 📁 Project Directory Structure

```text
cafe/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx               # Login screen with 1-click demo fillers
│   ├── (workspace)/
│   │   ├── layout.tsx                   # Role-aware workspace shell & nav
│   │   ├── captain/
│   │   │   ├── page.tsx                 # Table grid & active order status
│   │   │   ├── orders/new/page.tsx      # Order creation cart & menu browser
│   │   │   └── orders/[id]/page.tsx     # Order detail & live status
│   │   ├── kitchen/
│   │   │   └── page.tsx                 # Kitchen display system (New, Preparing, Ready)
│   │   ├── billing/
│   │   │   ├── page.tsx                 # Pending bills queue & paid history
│   │   │   ├── takeaway/page.tsx        # Fast takeaway order & billing
│   │   │   └── bills/[id]/page.tsx      # Bill checkout, payment & receipt
│   │   └── admin/
│   │       ├── page.tsx                 # Operational & financial summary
│   │       ├── menu/page.tsx            # Menu category & stock toggles
│   │       ├── tables/page.tsx          # Dining table management
│   │       ├── purchases/page.tsx       # Supplier purchases entry & list
│   │       ├── expenses/page.tsx        # Operating expense entry & list
│   │       ├── reports/page.tsx         # Basic sales & payment reports
│   │       └── staff/page.tsx           # Staff accounts & role assignments
│   ├── api/
│   │   └── health/route.ts              # API health check
│   ├── layout.tsx                       # Root layout & styling
│   └── globals.css                      # Tailwind v4 theme & print stylesheet
├── components/
│   ├── ui/                              # Accessible UI primitives (Button, Card, Dialog, etc.)
│   ├── layout/                          # AppHeader, RoleNav
│   ├── orders/                          # OrderCreator, OrderDetailView
│   ├── captain/                         # TableGrid
│   ├── kitchen/                         # KitchenQueue
│   ├── billing/                         # BillCheckout
│   ├── admin/                           # PurchaseManager, ExpenseManager, MenuManager, etc.
│   └── shared/                          # StatusBadge, EmptyState, LoadingSkeleton
├── lib/
│   ├── auth/session.ts                  # Secure cookies & JWT tokens
│   ├── db.ts                            # PrismaClient singleton
│   ├── permissions.ts                   # RBAC helpers & ActionResult type
│   ├── formatters/                      # Currency (INR) and date/time formatters
│   └── validations/schemas.ts           # Single source of truth Zod schemas
├── server/
│   ├── services/                        # Business logic decoupled from HTTP
│   └── actions/                         # Next.js Server Actions with RBAC & Zod
├── prisma/
│   ├── schema.prisma                    # PostgreSQL schema definition
│   └── seed.ts                          # Idempotent demo seed script
├── tests/
│   └── unit/                            # Pricing, transitions, and RBAC unit tests
└── package.json
```
#   c a f e - m a n a g m e n t  
 #   c a f e - m a n a g m e n t  
 