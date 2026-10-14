import { prisma } from "../../lib/db";
import { createOrderService, markOrderServedService, requestBillService, updateOrderItemStatusService } from "../../server/services/order-service";
import { recordPaymentService } from "../../server/services/billing-service";

async function runTest() {
  console.log("Starting order lifecycle verification against Supabase...");
  const table = await prisma.diningTable.findFirst({ where: { isActive: true } });
  const user = await prisma.user.findFirst({ where: { role: "CAPTAIN" } });
  const item = await prisma.menuItem.findFirst({ where: { isAvailable: true } });

  if (!table || !user || !item) {
    throw new Error("Missing seeded records");
  }

  console.log("Captain:", user.email, "| Table:", table.label, "| Menu item:", item.name);

  // 1. Create order
  const startOrder = Date.now();
  const order = await createOrderService({
    type: "DINE_IN",
    tableId: table.id,
    createdById: user.id,
    items: [{ menuItemId: item.id, quantity: 2, notes: "Extra spicy" }],
    submitImmediately: true,
  });
  console.log(`✓ Order #${order.orderNumber} created in ${Date.now() - startOrder}ms, status: ${order.status}`);

  // 2. Kitchen updates item to READY
  const startItem = Date.now();
  const updatedItem = await updateOrderItemStatusService(order.items[0].id, "READY");
  console.log(`✓ Kitchen item status updated to ${updatedItem.newStatus} in ${Date.now() - startItem}ms. Parent order status: ${updatedItem.parentOrderStatus}`);

  // 3. Captain marks served
  const startServed = Date.now();
  const servedOrder = await markOrderServedService(order.id);
  console.log(`✓ Order marked ${servedOrder.status} in ${Date.now() - startServed}ms`);

  // 4. Captain requests bill
  const startBill = Date.now();
  const billOrder = await requestBillService(order.id);
  console.log(`✓ Bill requested (${billOrder.status}) in ${Date.now() - startBill}ms`);

  // 5. Billing settles payment atomically
  const startPay = Date.now();
  const settlement = await recordPaymentService({
    orderId: order.id,
    cashierId: user.id,
    method: "UPI",
    reference: "UPI-LIFECYCLE-1234",
  });
  console.log(`✓ Payment settled in ${Date.now() - startPay}ms! Receipt: ${settlement.payment.receiptNo}, Order Status: ${settlement.order.status}`);
  console.log("ALL RESTAURANT OPERATIONS LIFECYCLE STAGES VERIFIED SUCCESSFULLY!");
}

runTest()
  .catch((err) => {
    console.error("Lifecycle verification failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
