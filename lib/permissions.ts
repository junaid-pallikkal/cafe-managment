import { Role } from "@prisma/client";
import { SessionUser } from "./auth/session";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

/**
 * Checks if the user is assigned any of the allowed roles.
 */
export function hasRole(user: SessionUser | null, allowedRoles: Role[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

/**
 * Route prefix redirect per role upon login.
 */
export function getDefaultRouteForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "CAPTAIN":
      return "/captain";
    case "KITCHEN":
      return "/kitchen";
    case "BILLING":
      return "/billing";
    default:
      return "/login";
  }
}
