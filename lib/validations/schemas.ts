import { z } from "zod";

export const RoleEnum = z.enum(["ADMIN", "CAPTAIN", "KITCHEN", "BILLING"]);
export const OrderTypeEnum = z.enum(["DINE_IN", "TAKEAWAY"]);
export const OrderStatusEnum = z.enum([
  "DRAFT",
  "SENT_TO_KITCHEN",
  "PREPARING",
  "READY",
  "SERVED",
  "BILL_REQUESTED",
  "PAID",
  "CANCELLED",
]);
export const ItemStatusEnum = z.enum(["QUEUED", "PREPARING", "READY", "CANCELLED"]);
export const PaymentMethodEnum = z.enum(["CASH", "UPI", "CARD", "OTHER"]);

export const LoginSchema = z.object({
  emailOrUsername: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export const OrderItemInputSchema = z.object({
  menuItemId: z.string().min(1, "Menu item ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  notes: z.string().max(200, "Notes cannot exceed 200 characters").optional(),
});

export const CreateOrderSchema = z.object({
  type: OrderTypeEnum,
  tableId: z.string().optional().nullable(),
  notes: z.string().max(300).optional().nullable(),
  items: z.array(OrderItemInputSchema).min(1, "At least one item is required"),
}).refine(
  (data) => {
    if (data.type === "DINE_IN" && !data.tableId) {
      return false;
    }
    return true;
  },
  {
    message: "Table is required for Dine-in orders",
    path: ["tableId"],
  }
);

export const UpdateItemStatusSchema = z.object({
  orderItemId: z.string().min(1),
  status: ItemStatusEnum,
});

export const RequestBillSchema = z.object({
  orderId: z.string().min(1),
});

export const RecordPaymentSchema = z.object({
  orderId: z.string().min(1),
  method: PaymentMethodEnum,
  amountTendered: z.number().min(0).optional(),
  reference: z.string().max(100).optional().nullable(),
});

export const CreatePurchaseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  supplier: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  category: z.string().min(1, "Category is required"),
  quantity: z.number().min(0.01).optional().nullable(),
  unit: z.string().optional().nullable(),
  amount: z.number().min(0.01, "Amount must be greater than zero"),
  notes: z.string().optional().nullable(),
});

export const CreateExpenseSchema = z.object({
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0.01, "Amount must be greater than zero"),
  method: PaymentMethodEnum.optional().nullable(),
  payee: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const MenuItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional().nullable(),
  price: z.number().min(0.01, "Price must be greater than zero"),
  categoryId: z.string().min(1, "Category is required"),
  isAvailable: z.boolean().default(true),
});

export const StaffUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: RoleEnum,
});
