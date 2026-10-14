import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely converts Prisma Decimal objects and complex prototypes into plain serializable
 * JSON objects so they can be passed across the Server Component -> Client Component boundary.
 */
export function serializeForClient<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}
