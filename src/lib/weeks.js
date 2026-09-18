import { prisma } from "@/lib/prisma";

/**
 * Resolves the currently active week across the application.
 * Strictly checks for an explicitly activated week (isActive = true).
 * Returns null if no active week exists, preserving administrator release control.
 * 
 * @returns {Promise<import("@prisma/client").Week | null>} The active week object or null.
 */
export async function getCurrentWeek() {
  return await prisma.week.findFirst({
    where: { isActive: true },
  });
}
