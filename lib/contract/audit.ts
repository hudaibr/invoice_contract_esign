import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { AuditEvent } from "./types";

export async function logEvent(
  contractId: string,
  event: AuditEvent,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    extra?: Record<string, unknown>;
  },
) {
  await prisma.esAuditLog.create({
    data: {
      contractId,
      event,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      metadata: (metadata?.extra ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function getEvents(contractId: string) {
  return prisma.esAuditLog.findMany({
    where: { contractId },
    orderBy: { timestamp: "asc" },
  });
}
