# Restaurant Operations Management System --- Buildathon Plan

> **Project type:** Team-based restaurant operations platform\
> **Primary goal:** Connect Captain, Kitchen, Billing, and Admin in one
> real-time workflow.\
> **Recommended stack:** Next.js App Router, TypeScript, Tailwind CSS,
> shadcn/ui, Prisma ORM, PostgreSQL, Zod.\
> **Buildathon strategy:** Deliver a polished, working end-to-end MVP
> first, then add reporting and advanced features if time remains.

------------------------------------------------------------------------

## 1. Product Vision

Build a responsive restaurant operations app that replaces paper-based
order slips and disconnected billing/expense records. Each staff role
sees only the screens and actions needed for their job, while the Admin
gets a live overview of the restaurant.

### Main workflow

1.  **Captain** selects a table or takeaway order, adds menu items and
    notes, and sends the order to the kitchen.
2.  **Kitchen staff** see incoming orders immediately, prepare the food,
    and mark individual items or the whole order as ready.
3.  **Captain** receives a visible ready status, serves the food, and
    sends the order to Billing when the customer asks to pay.
4.  **Billing staff** open the pending bill, verify items and totals,
    apply an allowed discount, record payment, and close the bill.
    Billing staff can also create and clear takeaway orders.
5.  **Admin** monitors live orders, sales, expenses, purchases, menu
    data, staff accounts, and reports.

### Success criteria

-   A Captain can submit an order without retyping it elsewhere.
-   Kitchen staff can see new orders and update preparation status.
-   Captain and Billing can see status changes without manually
    refreshing.
-   A bill is calculated from the server-side order data, not trusted
    client totals.
-   Admin can record purchases and expenses and see basic daily
    summaries.
-   The main flow works on laptop, tablet, and mobile screens.
-   A judge can complete a realistic demo from order creation through
    payment.

------------------------------------------------------------------------

## 2. Roles and Permissions

Use role-based access control (RBAC). Every protected server action/API
must check the authenticated user and role on the server. Hiding a
button in the UI is not authorization.

  -----------------------------------------------------------------------
  Role                    Main responsibilities   Allowed actions
  ----------------------- ----------------------- -----------------------
  **Captain**             Dine-in order taking    View table status,
                          and service             create/edit draft
                                                  orders, send orders to
                                                  kitchen, view
                                                  preparation status,
                                                  mark food served, send
                                                  bill request to Billing

  **Kitchen**             Food preparation        View kitchen queue,
                                                  acknowledge orders,
                                                  update item status,
                                                  mark items ready, view
                                                  item notes and elapsed
                                                  time

  **Billing**             Payment collection      View bill requests,
                                                  inspect order and
                                                  totals, record payment,
                                                  print/download receipt,
                                                  create and bill
                                                  takeaway orders

  **Admin**               Restaurant management   View all dashboards,
                                                  manage
                                                  users/menu/tables,
                                                  record purchases and
                                                  expenses, review sales
                                                  and reports,
                                                  cancel/void with
                                                  reason, configure
                                                  tax/service charges

  **Optional Manager**    Shift oversight         Read all operations and
                                                  approve selected
                                                  adjustments; can be
                                                  omitted for the
                                                  buildathon MVP
  -----------------------------------------------------------------------

### Permission rules

-   Only Admin can create or deactivate staff accounts.
-   Captain cannot mark an unpaid bill as paid.
-   Kitchen cannot change prices, discounts, or payment status.
-   Billing cannot alter kitchen preparation status.
-   Paid bills should not be silently edited. Corrections require an
    Admin-authorized void/refund action with a reason and audit log.
-   All money-changing operations must be recorded on the server and
    stored in the database.
-   Use a seeded demo account for each role during judging; never deploy
    with a publicly known production password.

------------------------------------------------------------------------

## 3. Functional Modules

### 3.1 Captain workspace

**Screens** - Table overview: Available, Occupied, Bill Requested,
Cleaning (optional). - New order / order editor. - Active orders and
preparation progress. - Order details with item-level statuses. -
Send-to-billing action.

**Order-taking flow** 1. Choose a table for dine-in or select Takeaway.
2. Browse/search menu categories and items. 3. Add quantity, optional
special instructions, and items. 4. Review subtotal and any configured
tax/service charge. 5. Submit to kitchen. 6. Show order number and live
status. 7. Receive ready notification and mark served. 8. Send bill
request when ready to pay.

**Important details** - Prevent accidental duplicate submission with an
idempotency key or a clear submission state. - Once an order is sent,
edits should be represented as an amendment/add-on order, rather than
silently replacing what the kitchen already received. - Show who created
the order and timestamps. - Make high-frequency actions usable with
large touch targets.

### 3.2 Kitchen display

**Screens** - Live queue, separated into New, Preparing, Ready. - Order
detail with item name, quantity, notes, table/takeaway number, and
elapsed time. - Ready action at item level; optional "Mark all ready"
action. - Completed orders history for the current shift.

**Kitchen flow** 1. A newly submitted order appears at the top of the
queue. 2. Kitchen acknowledges it and marks it Preparing. 3. Each item
can move through `QUEUED → PREPARING → READY`. 4. When all items are
ready, the order becomes Ready and the Captain is notified. 5. Kitchen
can see whether the order is dine-in or takeaway.

**Usability** - Use high contrast and a clear status label, not color
alone. - Sort oldest orders first, while clearly highlighting overdue
orders. - Keep the kitchen screen readable from a distance. - Avoid
destructive actions; a kitchen user should not delete an order.

### 3.3 Billing workspace

**Screens** - Pending bill requests. - Bill detail / checkout. -
Takeaway billing. - Completed transactions and receipt view.

**Billing flow** 1. Open a bill request from a Captain. 2. Load
authoritative order items and prices from the database. 3. Calculate
subtotal, discounts, tax, service charge, and final total on the server.
4. Select payment method: Cash, UPI, Card, or Other. 5. Record amount
tendered and change due for cash, if applicable. 6. Confirm payment. 7.
Mark order Paid/Closed and generate a receipt number. 8. Make the
receipt printable.

**Takeaway** - Billing staff can create a takeaway order, add menu
items, and send it to the kitchen. - A takeaway order follows the same
kitchen status flow. - It can be paid immediately or remain pending,
depending on restaurant policy. - Clearly show Takeaway and its order
number in both Kitchen and Billing.

**Financial safety** - Store money as integer minor units (for example,
paise) or use Prisma `Decimal` carefully. Never use JavaScript
floating-point arithmetic as the source of truth for currency. - Never
accept the final total from the browser as authoritative. - Record
payment amount, method, cashier, time, and reference when available. -
For the MVP, support one full payment per bill. Split payments, refunds,
and partial payments can be later enhancements.

### 3.4 Admin workspace

**Dashboard** - Today's gross sales and paid bill count. - Open orders
by status. - Pending bills. - Purchases and expenses recorded today. -
Estimated net operating figure: sales minus recorded purchases/expenses,
clearly labelled as an estimate and not formal accounting profit. -
Recent activity and alerts.

**Menu management** - Create/edit/deactivate categories and menu
items. - Set price, availability, description, and optional preparation
station. - Preserve order-item price/name snapshots so historical bills
do not change when the menu changes.

**Table management** - Create tables and set table labels/capacity. -
See table occupancy based on active orders. - Do not mark a table
available until the relevant order is closed and service/cleanup is
complete, according to the chosen workflow.

**Purchases** - Record supplier, invoice/reference, date,
item/description, quantity, unit, unit cost, total, and notes. -
Optionally categorize purchases (ingredients, beverages, packaging,
cleaning, equipment). - Allow receipt/invoice attachment only if file
storage is implemented safely; otherwise store a reference number.

**Expenses** - Record category, amount, date, payment method,
vendor/payee, description, and the staff member who entered it. -
Suggested categories: Rent, Utilities, Salaries, Maintenance, Delivery,
Packaging, Transport, Miscellaneous. - Require a reason and Admin
permission for edits/deletions; preferably use reversal entries instead
of deleting financial history.

**Reports** - Daily sales and transaction list. - Sales by payment
method. - Most-sold menu items. - Purchase and expense totals by
date/category. - Order preparation time and order counts. - CSV export
as a stretch goal.

**Staff** - Create/deactivate accounts and assign roles. - View recent
activity and shift totals where relevant. - Never expose password hashes
or session secrets in the UI.

------------------------------------------------------------------------

## 4. MVP Scope and Priorities

### P0 --- Must work for judging

-   Login and role-based dashboards.
-   Menu list and table/takeaway selection.
-   Captain creates and submits an order.
-   Kitchen receives the order and marks items ready.
-   Captain sees ready status.
-   Captain requests bill.
-   Billing clears bill and records payment.
-   Admin can record purchases and expenses.
-   Admin overview with live order counts and today's sales.
-   Database persistence, validation, basic error handling, responsive
    UI.
-   Seeded demo data and a repeatable demonstration script.

### P1 --- Add if time permits

-   Real-time updates using Server-Sent Events (SSE), WebSockets, or a
    managed realtime service.
-   Browser sound/toast notifications.
-   Receipt print stylesheet.
-   Menu availability toggle.
-   Search, filters, date ranges, and CSV export.
-   Audit log viewer.
-   Cash change calculator.

### P2 --- Post-buildathon enhancements

-   Split bills, partial payments, refunds, and discounts with approval.
-   Inventory and recipe-level stock deduction.
-   Supplier management and purchase-order workflow.
-   Multiple branches and centralized reporting.
-   Offline/PWA behavior with a safe sync strategy.
-   Kitchen stations, delivery management, customer display, loyalty,
    and integrations.

**Scope discipline:** Do not build every P2 feature before the full P0
workflow is tested.

------------------------------------------------------------------------

## 5. Recommended Technology Stack

  -----------------------------------------------------------------------
  Layer                   Choice                  Purpose
  ----------------------- ----------------------- -----------------------
  Framework               Next.js App Router +    Pages, layouts, server
                          TypeScript              components, route
                                                  handlers, server
                                                  actions

  Styling                 Tailwind CSS            Responsive design and
                                                  design tokens

  Components              shadcn/ui + Lucide      Accessible dialogs,
                          icons                   forms, tables, cards,
                                                  tabs, dropdowns, toasts

  Database                PostgreSQL              Reliable relational
                                                  data for orders, users,
                                                  bills, and financial
                                                  records

  ORM                     Prisma                  Typed database access,
                                                  schema, migrations

  Validation              Zod                     Validate inputs on
                                                  server and client

  Authentication          Auth.js or a carefully  Sign-in and session
                          implemented secure      handling
                          session solution        

  Realtime                SSE or WebSockets after Push order/status
                          the core workflow       changes to other role
                                                  screens

  Forms                   React Hook Form + Zod   Robust form validation
                          resolver                

  Charts                  Recharts (optional)     Admin dashboard and
                                                  reports

  Testing                 Vitest + Testing        Unit, component, and
                          Library; Playwright for workflow tests
                          end-to-end              

  Deployment              Vercel for Next.js +    Fast buildathon
                          managed PostgreSQL      deployment

  Version control         Git + GitHub            Collaboration and
                                                  rollback
  -----------------------------------------------------------------------

**Database recommendation:** Use PostgreSQL for this project because
orders, line items, payments, purchases, and expenses have clear
relational constraints. Confirm that the selected Prisma version and
hosting provider support the intended setup before coding.

------------------------------------------------------------------------

## 6. System Architecture

``` text
Captain UI ─────┐
Kitchen UI ─────┼── Next.js App Router
Billing UI ─────┤       ├── Server Actions / Route Handlers
Admin UI ───────┘       ├── Authentication + RBAC
                        ├── Zod validation
                        ├── Business logic/services
                        └── Prisma ORM
                               │
                         PostgreSQL
                               │
                    Orders / Payments / Audit Log

Status changes ──> refresh/polling for MVP
                └─> SSE/WebSockets for realtime upgrade
```

### Architectural rules

-   Use Server Components for data-heavy initial screens where
    practical.
-   Use Client Components for interactive forms, live status widgets,
    dialogs, and tables.
-   Keep business rules in reusable server-side service functions, not
    duplicated across UI components.
-   Use Server Actions for straightforward form mutations and Route
    Handlers for APIs/integrations. Both require authentication,
    authorization, and validation.
-   Never import database code into client components.
-   Do not expose database credentials or secrets through
    `NEXT_PUBLIC_*` variables.
-   Use database transactions for order submission and payment
    recording.
-   Revalidate affected pages/tags after mutations. Add SSE/WebSockets
    only after polling/refresh gives a correct working MVP.

------------------------------------------------------------------------

## 7. Suggested Project Structure

Keep the Next.js App Router in the root `app/` directory and use
TypeScript.

``` text
restaurant-ops/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (workspace)/
│   │   ├── layout.tsx
│   │   ├── captain/
│   │   │   ├── page.tsx
│   │   │   ├── orders/new/page.tsx
│   │   │   └── orders/[id]/page.tsx
│   │   ├── kitchen/page.tsx
│   │   ├── billing/
│   │   │   ├── page.tsx
│   │   │   ├── takeaway/page.tsx
│   │   │   └── bills/[id]/page.tsx
│   │   └── admin/
│   │       ├── page.tsx
│   │       ├── menu/page.tsx
│   │       ├── tables/page.tsx
│   │       ├── purchases/page.tsx
│   │       ├── expenses/page.tsx
│   │       ├── reports/page.tsx
│   │       └── staff/page.tsx
│   ├── api/
│   │   ├── health/route.ts
│   │   └── events/route.ts       # Optional SSE later
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/ui generated components
│   ├── layout/
│   ├── orders/
│   ├── kitchen/
│   ├── billing/
│   ├── admin/
│   └── shared/
├── lib/
│   ├── auth/
│   ├── db.ts
│   ├── permissions.ts
│   ├── validations/
│   ├── formatters/
│   └── utils.ts
├── server/
│   ├── services/
│   │   ├── order-service.ts
│   │   ├── billing-service.ts
│   │   ├── purchase-service.ts
│   │   └── expense-service.ts
│   └── actions/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── tests/
│   ├── unit/
│   └── e2e/
├── public/
├── .env.example
├── package.json
└── README.md
```

This is a starting structure, not a requirement to create every file
immediately. Build a vertical slice first and add folders as modules
become real.

------------------------------------------------------------------------

## 8. Data Model

### Core entities

-   **User**: staff identity, role, active status, password/session
    integration.
-   **DiningTable**: table label, capacity, active status.
-   **MenuCategory**: category name, sort order, active status.
-   **MenuItem**: item name, category, current price, availability.
-   **Order**: order number, type, table, creator, status, timestamps,
    totals.
-   **OrderItem**: menu item reference plus name/price snapshot,
    quantity, notes, preparation status.
-   **Payment**: bill reference, amount, method, receipt number,
    cashier, timestamp.
-   **Purchase**: supplier/reference, description, amount, date,
    creator.
-   **Expense**: category, description, amount, date, payment method,
    creator.
-   **AuditLog**: actor, action, entity type/id, reason, timestamp, safe
    metadata.

### Suggested Prisma schema outline

This is a design baseline; check syntax against the installed Prisma
version and adapt authentication fields to the chosen auth library
before running migrations.

``` prisma
enum Role {
  ADMIN
  CAPTAIN
  KITCHEN
  BILLING
}

enum OrderType {
  DINE_IN
  TAKEAWAY
}

enum OrderStatus {
  DRAFT
  SENT_TO_KITCHEN
  PREPARING
  READY
  SERVED
  BILL_REQUESTED
  PAID
  CANCELLED
}

enum ItemStatus {
  QUEUED
  PREPARING
  READY
  CANCELLED
}

enum PaymentMethod {
  CASH
  UPI
  CARD
  OTHER
}

model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  role         Role
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  createdOrders Order[] @relation("OrderCreator")
  payments      Payment[] @relation("CashierPayments")
  purchases     Purchase[]
  expenses      Expense[]
  auditLogs     AuditLog[]
}

model DiningTable {
  id        String   @id @default(cuid())
  label     String   @unique
  capacity  Int      @default(4)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  orders    Order[]
}

model MenuCategory {
  id        String     @id @default(cuid())
  name      String     @unique
  sortOrder Int        @default(0)
  isActive  Boolean    @default(true)
  items     MenuItem[]
}

model MenuItem {
  id          String       @id @default(cuid())
  name        String
  description String?
  price       Decimal      @db.Decimal(10, 2)
  isAvailable Boolean      @default(true)
  categoryId  String
  category    MenuCategory @relation(fields: [categoryId], references: [id])
  orderItems  OrderItem[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([categoryId, isAvailable])
}

model Order {
  id             String      @id @default(cuid())
  orderNumber    Int         @unique @default(autoincrement())
  type           OrderType
  status         OrderStatus @default(DRAFT)
  tableId        String?
  table          DiningTable? @relation(fields: [tableId], references: [id])
  createdById    String
  createdBy      User        @relation("OrderCreator", fields: [createdById], references: [id])
  items          OrderItem[]
  payments       Payment[]
  notes          String?
  subtotal       Decimal     @db.Decimal(10, 2) @default(0)
  discountAmount Decimal     @db.Decimal(10, 2) @default(0)
  taxAmount      Decimal     @db.Decimal(10, 2) @default(0)
  serviceCharge  Decimal     @db.Decimal(10, 2) @default(0)
  total          Decimal     @db.Decimal(10, 2) @default(0)
  sentAt         DateTime?
  readyAt        DateTime?
  billRequestedAt DateTime?
  paidAt         DateTime?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  @@index([status, createdAt])
  @@index([type, createdAt])
  @@index([tableId, status])
}

model OrderItem {
  id             String     @id @default(cuid())
  orderId        String
  order          Order      @relation(fields: [orderId], references: [id], onDelete: Cascade)
  menuItemId     String?
  menuItem       MenuItem?  @relation(fields: [menuItemId], references: [id], onDelete: SetNull)
  nameSnapshot   String
  unitPrice      Decimal    @db.Decimal(10, 2)
  quantity       Int
  notes          String?
  status         ItemStatus @default(QUEUED)
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  @@index([orderId, status])
}

model Payment {
  id          String        @id @default(cuid())
  orderId     String
  order       Order         @relation(fields: [orderId], references: [id])
  cashierId   String
  cashier     User          @relation("CashierPayments", fields: [cashierId], references: [id])
  receiptNo   String        @unique
  amount      Decimal       @db.Decimal(10, 2)
  method      PaymentMethod
  reference   String?
  createdAt   DateTime      @default(now())

  @@index([createdAt, method])
}

model Purchase {
  id          String   @id @default(cuid())
  description String
  supplier    String?
  reference   String?
  category    String
  quantity    Decimal? @db.Decimal(10, 3)
  unit        String?
  amount      Decimal  @db.Decimal(10, 2)
  purchasedAt DateTime @default(now())
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])
  notes       String?
  createdAt   DateTime @default(now())

  @@index([purchasedAt, category])
}

model Expense {
  id          String   @id @default(cuid())
  category    String
  description String
  amount      Decimal  @db.Decimal(10, 2)
  method      PaymentMethod?
  payee       String?
  spentAt     DateTime @default(now())
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])
  notes       String?
  createdAt   DateTime @default(now())

  @@index([spentAt, category])
}

model AuditLog {
  id         String   @id @default(cuid())
  actorId    String
  actor      User     @relation(fields: [actorId], references: [id])
  action     String
  entityType String
  entityId   String
  reason     String?
  metadata   Json?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId, createdAt])
  @@index([actorId, createdAt])
}
```

### Schema notes and safeguards

-   The schema is a starting point. Validate all relations and defaults
    with `prisma validate` and a migration before building on it.
-   Use `Decimal` consistently for money, then convert to a safe
    string/number representation at the UI boundary. Never serialize
    Prisma Decimal objects carelessly.
-   For tax-inclusive or tax-exclusive prices, choose one policy and
    document it. Keep the formula consistent.
-   Enforce `quantity >= 1`, valid price, and valid status transitions
    in server-side validation/business logic. Prisma schema alone does
    not enforce all business rules.
-   Add a unique idempotency key to order submission/payment creation if
    retry duplication is a realistic risk.
-   If a restaurant can have multiple orders per table, define the exact
    rule for active table occupancy.
-   The simple `Payment` model supports a single full payment in the
    MVP. Add a payment status and refund/void model before supporting
    complex payment flows.
-   Store a snapshot of item name and unit price in `OrderItem`, so menu
    changes never rewrite old bills.
-   Avoid hard-deleting financial records. Use
    cancellation/void/reversal records with actor, timestamp, and
    reason.

------------------------------------------------------------------------

## 9. Order State Machine

Use explicit, validated state transitions. Do not allow arbitrary status
strings from the client.

``` text
DRAFT
  └─ Captain submits → SENT_TO_KITCHEN
                           └─ Kitchen starts → PREPARING
                                                 └─ All active items ready → READY
                                                                               └─ Captain serves → SERVED
                                                                                                     └─ Captain requests bill → BILL_REQUESTED
                                                                                                                               └─ Billing confirms payment → PAID

Any eligible unpaid order may be cancelled only through an authorized flow with a reason.
```

### Rules

-   An order is `READY` only when all non-cancelled order items are
    `READY`.
-   `BILL_REQUESTED` should not be set before the order is served unless
    the restaurant intentionally allows early billing.
-   A takeaway order may follow
    `SENT_TO_KITCHEN → PREPARING → READY → BILL_REQUESTED/PAID`,
    according to the payment policy selected for the demo.
-   Payment creation and order transition to `PAID` must happen in one
    database transaction.
-   If two Billing staff members try to clear the same bill, only one
    should succeed. Re-check status within the transaction and return a
    clear conflict message to the other.
-   Store timestamps for sent, ready, bill requested, and paid to
    support reporting.

------------------------------------------------------------------------

## 10. API / Server Action Plan

Use a consistent result shape and validate every input with Zod. The
list below describes operations, not a requirement to expose every
operation as a public REST API.

  ----------------------------------------------------------------------------
  Operation                 Role                    Responsibility
  ------------------------- ----------------------- --------------------------
  `getCurrentUser`          Authenticated           Return safe session
                                                    profile

  `getTables`               Captain/Admin           Return active tables and
                                                    occupancy

  `getMenu`                 Authenticated staff     Return available
                                                    categories/items

  `createOrder`             Captain/Billing         Create a draft order and
                                                    items

  `submitOrder`             Captain/Billing         Validate, price from DB,
                                                    and send to kitchen

  `getKitchenQueue`         Kitchen                 Return active kitchen
                                                    orders

  `updateOrderItemStatus`   Kitchen                 Move item to
                                                    Preparing/Ready

  `markOrderServed`         Captain                 Mark ready order served

  `requestBill`             Captain                 Move served order to Bill
                                                    Requested

  `getPendingBills`         Billing                 Return orders awaiting
                                                    payment

  `recordPayment`           Billing                 Atomically create payment
                                                    and close order

  `createPurchase`          Admin                   Record a purchase

  `createExpense`           Admin                   Record an expense

  `getAdminSummary`         Admin                   Return aggregate metrics

  `manageMenuItem`          Admin                   Create/update/deactivate
                                                    menu item

  `manageStaff`             Admin                   Create/deactivate staff
                                                    accounts

  `getAuditLog`             Admin                   Search recent
                                                    privileged/financial
                                                    changes
  ----------------------------------------------------------------------------

### Mutation pattern

For each mutation:

1.  Authenticate the user.
2.  Authorize the role on the server.
3.  Parse input with Zod.
4.  Read authoritative records from the database.
5.  Validate business rules and allowed status transition.
6.  Run related writes in a database transaction.
7.  Write an audit log for sensitive changes.
8.  Revalidate relevant paths/tags or publish a status event.
9.  Return a typed success/error result without leaking stack traces or
    secrets.

Example result convention:

``` ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };
```

Do not use this type to expose internal database errors verbatim. Log
technical details on the server and show a safe message to staff.

------------------------------------------------------------------------

## 11. Authentication and Security

-   Require sign-in for all staff pages and mutations.
-   Hash passwords using a modern password-hashing library if
    credentials are managed directly. Never store plaintext passwords.
-   Prefer secure, HTTP-only, `Secure` (in production), `SameSite`
    cookies for sessions.
-   Protect against unauthorized direct calls to Server Actions and
    Route Handlers; middleware alone is not sufficient.
-   Validate all fields on the server, including IDs, quantities,
    amounts, and status transitions.
-   Add rate limiting to login and other abuse-prone endpoints if the
    deployment setup supports it.
-   Do not reveal whether an email exists during password reset flows.
-   Use least-privilege database credentials and keep `.env` out of Git.
-   Add `.env.example` with placeholder values only.
-   Use safe error messages and structured server logs; never log
    passwords, session tokens, or payment secrets.
-   Use HTTPS in production.
-   Protect financial actions with confirmation dialogs and audit
    logging.
-   For destructive or corrective actions, require a reason and restrict
    access.
-   Escape/render user-provided notes safely; do not render them as raw
    HTML.
-   Back up the database and know how to restore it before using real
    restaurant data.
-   Treat this as an operational MVP, not certified accounting or
    payment-processing software. Do not store card numbers or CVV;
    record only the payment method and permitted transaction reference.

------------------------------------------------------------------------

## 12. UI/UX Design Direction

### Visual direction

-   Clean, professional restaurant POS/dashboard.
-   Use a calm **soft mint / deep green** accent system with neutral
    surfaces, readable text, and restrained status colors.
-   Use shadcn/ui for consistent components and accessible behavior.
-   Avoid excessive gradients, glass effects, and decorative animation;
    staff need speed and clarity.
-   Use responsive layouts: desktop sidebar, compact mobile navigation,
    and touch-friendly controls.
-   Keep critical buttons large and consistently placed.

### Shared layout

-   Header: restaurant name, current role, shift/date, connection
    status, profile/logout.
-   Navigation changes by role.
-   Main area: page title, key actions, status summary, content.
-   Toasts for success/failure; confirmation dialog for payment,
    cancellation, or sensitive changes.
-   Loading skeletons and empty states for all queue/list screens.

### Role-specific UI

**Captain** - Table grid with status chips. - Menu category tabs and
item search. - Order cart fixed to the side on desktop and as a bottom
sheet on mobile. - Clear "Send to Kitchen" and "Request Bill" actions.

**Kitchen** - Large order cards with elapsed time and notes. - Three
clear columns/tabs: New, Preparing, Ready. - One-tap "Start" and "Mark
Ready" actions. - Auto-refresh or live updates with a visible
last-updated/connection indicator.

**Billing** - Prominent pending bill queue. - Checkout panel with
itemized subtotal, tax, discount, total, method, amount tendered, and
change. - Payment confirmation and print receipt actions. - Make
duplicate payment prevention obvious.

**Admin** - KPI cards, active order summary, sales chart if time
permits, latest purchases/expenses, and quick actions. - Forms should
use labels, inline validation, sensible defaults, and explicit currency
formatting. - Reports should work without charts; a correct table is
more valuable than a decorative graph.

### Accessibility

-   Do not communicate status through color alone; include text/icon
    labels.
-   Use keyboard-accessible dialogs and controls.
-   Maintain readable contrast and focus states.
-   Add labels to icon-only buttons and test on a narrow mobile
    viewport.

------------------------------------------------------------------------

## 13. Real-Time Updates

### Fastest reliable MVP

Start with server-side mutations plus client refresh/polling every few
seconds on the Kitchen, Captain, and Billing queues. This is easier to
build and debug during a time-limited event.

### Upgrade to realtime

If time permits, add SSE or WebSockets for events such as:

-   `order.created`
-   `order.preparing`
-   `order.item_ready`
-   `order.ready`
-   `order.bill_requested`
-   `order.paid`

Events should contain IDs and minimal safe data. The receiving screen
should refetch authorized data from the server rather than trusting the
event payload as the source of truth.

**Do not let a dropped realtime connection block work.** Show connection
state and provide a manual refresh/fallback poll.

------------------------------------------------------------------------

## 14. Buildathon Team Plan --- 3 Students

Divide ownership by vertical slice, with one shared integration owner.
Everyone should understand the complete end-to-end workflow.

  -------------------------------------------------------------------------------
  Team member             Primary ownership               Deliverables
  ----------------------- ------------------------------- -----------------------
  **Student 1 ---         App shell, shadcn components,   Responsive layouts,
  Frontend & UX**         Captain and Billing UI          order cart, checkout
                                                          UI, loading/empty/error
                                                          states

  **Student 2 --- Backend Prisma schema, database,        Migrations, seed data,
  & Data**                services, validation, auth/RBAC secure mutations,
                                                          order/payment business
                                                          logic

  **Student 3 --- Kitchen Kitchen display, Admin          Kitchen queue, admin
  & Admin + QA/Deploy**   purchases/expenses/dashboard,   forms, test checklist,
                          integration tests, deployment   demo environment and
                                                          README
  -------------------------------------------------------------------------------

### Collaboration rules

-   Agree on database entities, statuses, and action signatures before
    parallel coding.
-   Use one Git branch per feature and small pull requests/merges.
-   Do not let multiple people independently rewrite `schema.prisma` or
    shared route contracts.
-   Student 2 owns schema/migrations; others request changes through
    agreed commits.
-   Use a shared `.env.example` and a single source of truth for
    types/validation.
-   Integrate early, not on the final hour.
-   At each checkpoint, keep the main branch runnable.

------------------------------------------------------------------------

## 15. Execution Timeline

Adapt the hours to the event schedule. The order is more important than
the exact duration.

### Phase 1 --- Understand and scope (first 5--10% of time)

-   Read the on-the-spot problem statement carefully.
-   Identify the user, pain point, and measurable outcome.
-   Write the primary user journey and the P0 feature list.
-   Agree on role permissions and order status transitions.
-   Sketch the Captain → Kitchen → Captain → Billing flow.
-   Decide the currency/tax policy for the demo.
-   Create a simple wireframe before polishing visual design.

**Checkpoint:** Everyone can explain the same MVP in one minute.

### Phase 2 --- Foundation (next 15%)

-   Inspect the existing repository before editing it.
-   Confirm Next.js App Router, TypeScript, Tailwind, and shadcn/ui
    setup.
-   Configure environment variables and database connection.
-   Write Prisma schema and run validation/migration.
-   Add seed data for menu, tables, and demo users.
-   Build login and role-specific route protection.
-   Create shared layout/navigation and error/loading patterns.

**Checkpoint:** App starts, database connects, and each demo role can
sign in.

### Phase 3 --- Vertical slice (next 30%)

Build the full order flow before adding secondary features:

1.  Captain creates and submits an order.
2.  Order is persisted and visible in Kitchen.
3.  Kitchen updates item/order status.
4.  Captain sees Ready status.
5.  Captain requests the bill.
6.  Billing records payment.
7.  The order becomes Paid and appears in the Admin summary.

**Checkpoint:** One complete end-to-end order works using the real
database.

### Phase 4 --- Admin and polish (next 20%)

-   Add purchases and expenses forms.
-   Add menu/table management only as needed for the demo.
-   Add admin summary cards.
-   Improve status indicators, responsive behavior, validation, and
    error messages.
-   Add print-ready receipt.
-   Add polling/realtime only after the core workflow is stable.

**Checkpoint:** Admin can record financial entries and review activity.

### Phase 5 --- Testing and deployment (next 20%)

-   Test each role with separate browser sessions.
-   Test invalid transitions and double-click/double-payment cases.
-   Test mobile widths and kitchen display readability.
-   Deploy frontend and provision PostgreSQL.
-   Apply migrations to the deployed database and seed demo records.
-   Verify production environment variables.
-   Run the demo script against the deployed app.

**Checkpoint:** The deployed prototype works from login to receipt.

### Phase 6 --- Presentation and buffer (final 5--10%)

-   Freeze features.
-   Fix only high-impact bugs.
-   Prepare a short slide deck and demo script.
-   Keep a backup local run path in case the network/deployment fails.
-   Ensure demo accounts and seed data are ready.

------------------------------------------------------------------------

## 16. Setup Commands

These commands are a starting point; use the versions supported by the
current project and event environment.

``` bash
# Create a new project only if a repository has not already been provided
npx create-next-app@latest restaurant-ops --typescript --tailwind --eslint --app

cd restaurant-ops

# Add shadcn/ui using its current official setup instructions
npx shadcn@latest init

# Add Prisma and validation
npm install prisma @prisma/client zod
npm install react-hook-form @hookform/resolvers

# Optional charts
npm install recharts

# Initialize Prisma (choose PostgreSQL)
npx prisma init
```

After creating `schema.prisma` and setting `DATABASE_URL`:

``` bash
npx prisma format
npx prisma validate
npx prisma migrate dev --name init
npx prisma generate
```

Add a seed script in `prisma/seed.ts`, configure it according to the
installed Prisma version, then run the supported seed command.

### Environment variables

`.env.example` should document names, not real secrets:

``` dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/restaurant_ops"
AUTH_SECRET="replace-with-a-long-random-secret"
APP_URL="http://localhost:3000"
```

Use the authentication provider's required environment variables if
using Auth.js. Do not commit the real `.env` file.

### First run

``` bash
npm run dev
```

Before deployment, run the project's lint, typecheck, test, and
production build commands. Add missing scripts in `package.json` rather
than assuming they exist.

------------------------------------------------------------------------

## 17. Seed Data for the Demo

Create fictional records that make the app immediately usable:

### Tables

-   T1 --- 2 seats
-   T2 --- 4 seats
-   T3 --- 4 seats
-   T4 --- 6 seats

### Menu categories and sample items

-   **Starters:** Chicken 65, Veg Roll
-   **Main Course:** Chicken Biriyani, Veg Biriyani, Porotta
-   **Drinks:** Lime Juice, Water
-   **Dessert:** Ice Cream

Use realistic but clearly demo-only prices. Ensure the same database
menu data is used by Captain and Billing.

### Demo users

-   `captain.demo`
-   `kitchen.demo`
-   `billing.demo`
-   `admin.demo`

Create passwords through a seed script using the same secure
password-hashing method as the app. Display credentials only in the
private demo setup notes, never in public client code or a production
banner.

------------------------------------------------------------------------

## 18. Testing Checklist

### Authentication and authorization

-   [ ] Unauthenticated user cannot access workspace pages or mutations.
-   [ ] Captain cannot access Admin purchase/expense mutation endpoints.
-   [ ] Kitchen cannot record a payment.
-   [ ] Billing cannot change an item to Ready.
-   [ ] Inactive staff cannot continue to use protected actions.
-   [ ] Sign-out invalidates the session.

### Orders and kitchen

-   [ ] Captain can create a dine-in order.
-   [ ] Captain can create/send a takeaway order where permitted.
-   [ ] Order and item data persist after refresh.
-   [ ] Kitchen sees newly submitted orders.
-   [ ] Kitchen can mark items Preparing and Ready.
-   [ ] Order only becomes Ready when all active items are Ready.
-   [ ] Captain sees the correct ready state.
-   [ ] Invalid status transitions are rejected.
-   [ ] Duplicate submissions do not create unintended duplicate orders.

### Billing

-   [ ] Only eligible orders can be sent for billing.
-   [ ] Total is calculated from database prices.
-   [ ] Invalid quantities, negative discounts, and malformed amounts
    are rejected.
-   [ ] Successful payment records cashier, method, amount, receipt, and
    timestamp.
-   [ ] Double-clicking Pay cannot create two payments.
-   [ ] Paid orders cannot be paid again.
-   [ ] Receipt shows correct item snapshots and totals.

### Admin and finance

-   [ ] Purchase and expense entries persist.
-   [ ] Invalid/negative amounts are rejected.
-   [ ] Daily sales include paid orders only.
-   [ ] Purchases and expenses are not incorrectly counted as sales.
-   [ ] Historical order prices remain unchanged after menu price edits.
-   [ ] Sensitive corrections create an audit record.

### UI and deployment

-   [ ] Layout works at phone, tablet, and desktop widths.
-   [ ] Forms have loading, success, validation, and error states.
-   [ ] Keyboard navigation and visible focus work.
-   [ ] Empty queues show helpful empty states.
-   [ ] Production build succeeds.
-   [ ] Deployed environment connects to the correct database.
-   [ ] Seed/demo data is present after deployment.
-   [ ] No secrets appear in the repository or browser bundle.

------------------------------------------------------------------------

## 19. Deployment Plan

1.  Push the project to a private or appropriate GitHub repository.
2.  Create a managed PostgreSQL database.
3.  Configure the production `DATABASE_URL` and auth secrets in the
    deployment provider.
4.  Deploy the Next.js app to Vercel or another compatible host.
5.  Run production migrations using the deployment workflow
    (`prisma migrate deploy` for a migration-based setup).
6.  Seed only safe demo data if needed.
7.  Verify login, order creation, kitchen status, bill request, payment,
    purchases, and expenses on the deployed URL.
8.  Confirm logs do not leak secrets and database access is restricted.
9.  Prepare a local fallback if internet access is unreliable.

Do not use `prisma db push` as a substitute for a controlled production
migration workflow once real data matters.

------------------------------------------------------------------------

## 20. Demo Presentation Plan

Keep the presentation focused on the problem, solution, and working
product. A suggested 4--6 minute demonstration:

### Slide 1 --- Problem

Orders and updates can be lost when Captains, kitchen staff, and billing
use separate paper slips or verbal communication. Purchases and expenses
are also difficult to track in one place.

### Slide 2 --- Solution

Introduce one role-based platform that connects the restaurant workflow
and centralizes basic operational records.

### Live demo

1.  Sign in as **Captain** and create a dine-in order for T1.
2.  Send it to the kitchen.
3.  Switch to **Kitchen** and show the order arriving.
4.  Mark the items Preparing, then Ready.
5.  Switch back to **Captain** and show the ready status.
6.  Mark the order served and request the bill.
7.  Switch to **Billing**, open the pending bill, record a demo payment,
    and show the receipt.
8.  Switch to **Admin**, show the paid order/sales summary, and add a
    sample purchase and expense.
9.  Highlight how the same records are shared across roles.

### Slide 3 --- Implementation

Explain Next.js App Router, TypeScript, shadcn/ui, Prisma, PostgreSQL,
server-side validation, RBAC, and the order state machine.

### Slide 4 --- Security and reliability

Show role permissions, server-side total calculation, transaction-safe
payment recording, audit trail for sensitive changes, and test coverage.

### Slide 5 --- Impact and future scope

Explain reduced order confusion, faster kitchen coordination, clearer
billing, and centralized operating records. Mention inventory
integration, advanced reports, and multiple branches as future work.

**Demo tip:** Do not spend the whole presentation on slides. The
strongest evidence is a real order moving across the three operational
roles and appearing in Admin.

------------------------------------------------------------------------

## 21. Google Antigravity Implementation Prompt

Copy this into Google Antigravity after opening the project repository.
Ask it to work incrementally and verify each milestone.

``` text
You are the senior full-stack engineer helping a 3-student buildathon team build a Restaurant Operations Management System.

STACK
- Next.js App Router in the root app/ directory
- TypeScript with strict typing
- Tailwind CSS
- shadcn/ui and Lucide icons
- Prisma ORM with PostgreSQL
- Zod validation
- Secure authentication and server-side role-based authorization
- Responsive design for desktop, tablet, and mobile

PRODUCT WORKFLOW
1. Captain creates dine-in or takeaway orders and sends them to Kitchen.
2. Kitchen sees new orders and changes item status to Preparing/Ready.
3. Captain sees ready status, marks the food served, and requests a bill.
4. Billing opens pending bills, calculates the authoritative total on the server, records payment, closes the order, and produces a printable receipt. Billing can also create takeaway orders.
5. Admin sees operational summaries and manages menu/tables/staff as time permits; Admin records purchases and expenses and views basic reports.

ROLES
ADMIN, CAPTAIN, KITCHEN, BILLING.
Every server mutation must authenticate, authorize the role, validate input with Zod, enforce valid state transitions, and return safe errors. Never rely on client-side hiding for security.

WORKING RULES
1. Inspect the existing repository before changing files. Do not recreate, reset, or overwrite a working project without a clear reason.
2. First report the existing stack, current structure, and any blockers.
3. Create a short implementation checklist and work in these milestones:
   A. Foundation, environment, database schema, migrations, seed data
   B. Authentication, sessions, role-based route protection
   C. Shared layout and role dashboards
   D. Captain order creation/submission
   E. Kitchen queue and item status updates
   F. Captain ready status and bill request
   G. Billing checkout, transaction-safe payment, receipt
   H. Admin purchases, expenses, and summary
   I. Tests, responsive polish, accessibility, and deployment documentation
4. Implement and verify one milestone at a time. After each milestone, summarize changed files, commands run, tests/build status, and remaining issues before proceeding.
5. Keep the application runnable after every milestone. Integrate frequently; do not postpone integration until the end.
6. Use reusable components and server-side service functions. Do not duplicate business rules across pages.
7. Use database-backed menu prices and item snapshots. Never trust client-supplied totals. Record payment and transition the order to PAID in one database transaction, preventing duplicate payments.
8. Use a documented order state machine. Validate status transitions server-side.
9. Use Decimal/integer-minor-unit-safe money handling. Never use floating-point browser arithmetic as the financial source of truth.
10. Use a clean, polished restaurant POS design with a soft mint/deep green accent, neutral surfaces, clear status text, accessible contrast, and touch-friendly controls. Use shadcn/ui consistently.
11. Build the P0 end-to-end workflow before optional charts, animations, or advanced features. For real-time status, start with reliable refresh/polling and upgrade only if time permits.
12. Add seed data and demo users using secure password hashing. Never hardcode production secrets or expose secrets to the browser.
13. Add tests for role permissions, order transitions, pricing, duplicate payment prevention, and the primary end-to-end workflow.
14. Run Prisma format/validate/migrations as appropriate, lint, typecheck, tests, and production build. Do not claim a command passed unless you ran it and saw success.
15. Update README.md with setup, environment variables, migrations, seeding, demo workflow, tests, and deployment steps.

MVP ACCEPTANCE CRITERIA
- A Captain can create and submit an order.
- Kitchen can see it and mark its items ready.
- Captain can see ready status and request a bill.
- Billing can record payment exactly once and generate a receipt.
- Admin can add purchases and expenses and see today's paid sales.
- Role restrictions are enforced on the server.
- Data persists in PostgreSQL.
- The main flow works on mobile and desktop.
- The app can be deployed and demonstrated reliably.

Start by inspecting the repository and reporting the plan. Do not generate the entire application in one uncontrolled pass. Prioritize a correct, testable vertical slice.
```

------------------------------------------------------------------------

## 22. Final Buildathon Strategy

If time gets tight, prioritize in this order:

1.  **Complete the order-to-payment workflow.**
2.  **Enforce roles and protect financial mutations.**
3.  **Make the interface clear and responsive.**
4.  **Add purchases, expenses, and a basic Admin summary.**
5.  **Test and deploy.**
6.  Add charts, advanced realtime, and optional features only after the
    above work.

A small, stable product that completes one real restaurant workflow is a
stronger buildathon submission than a visually impressive dashboard
whose buttons are not connected to real data.
