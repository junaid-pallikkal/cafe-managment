import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Standard transaction configuration for cloud-hosted databases (e.g. Supabase).
 * Prevents transaction expiration due to WAN latency or connection pool acquisition.
 */
export const TX_CONFIG = {
  maxWait: 15000, // 15s max waiting for transaction connection slot
  timeout: 30000, // 30s max transaction execution duration
} as const;
