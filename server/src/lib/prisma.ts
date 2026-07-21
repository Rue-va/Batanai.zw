import { PrismaClient } from '@prisma/client';

// Reuse a single client across module reloads in dev (tsx watch) to avoid
// exhausting the database's connection limit.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
