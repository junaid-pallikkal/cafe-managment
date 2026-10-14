import { test, describe } from "node:test";
import assert from "node:assert";
import { Role } from "@prisma/client";
import { hasRole, getDefaultRouteForRole } from "@/lib/permissions";
import { SessionUser } from "@/lib/auth/session";

describe("RBAC Permissions and Route Guards", () => {
  const adminUser: SessionUser = {
    id: "usr-admin",
    name: "Admin User",
    email: "admin@restaurant.demo",
    role: Role.ADMIN,
  };

  const captainUser: SessionUser = {
    id: "usr-captain",
    name: "Captain User",
    email: "captain@restaurant.demo",
    role: Role.CAPTAIN,
  };

  const kitchenUser: SessionUser = {
    id: "usr-kitchen",
    name: "Kitchen Chef",
    email: "kitchen@restaurant.demo",
    role: Role.KITCHEN,
  };

  const billingUser: SessionUser = {
    id: "usr-billing",
    name: "Cashier User",
    email: "billing@restaurant.demo",
    role: Role.BILLING,
  };

  test("hasRole correctly validates permitted roles", () => {
    assert.strictEqual(hasRole(adminUser, [Role.ADMIN]), true);
    assert.strictEqual(hasRole(captainUser, [Role.CAPTAIN, Role.ADMIN]), true);
    assert.strictEqual(hasRole(kitchenUser, [Role.CAPTAIN]), false);
    assert.strictEqual(hasRole(null, [Role.ADMIN]), false);
  });

  test("Captain cannot execute payment settlement", () => {
    const paymentPermittedRoles = [Role.BILLING, Role.ADMIN];
    assert.strictEqual(hasRole(captainUser, paymentPermittedRoles), false);
    assert.strictEqual(hasRole(billingUser, paymentPermittedRoles), true);
  });

  test("Kitchen cannot access financial or admin routes", () => {
    const financePermittedRoles = [Role.ADMIN];
    assert.strictEqual(hasRole(kitchenUser, financePermittedRoles), false);
    assert.strictEqual(hasRole(adminUser, financePermittedRoles), true);
  });

  test("Default route redirections match roles", () => {
    assert.strictEqual(getDefaultRouteForRole(Role.ADMIN), "/admin");
    assert.strictEqual(getDefaultRouteForRole(Role.CAPTAIN), "/captain");
    assert.strictEqual(getDefaultRouteForRole(Role.KITCHEN), "/kitchen");
    assert.strictEqual(getDefaultRouteForRole(Role.BILLING), "/billing");
  });
});
