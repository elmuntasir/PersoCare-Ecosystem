"use server";

import { prisma } from "@/lib/prisma";

/**
 * Resolves a login identifier (which may be a username or email address)
 * into a valid email address registered with Supabase Auth.
 */
export async function resolveIdentifierToEmail(identifier: string): Promise<string | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  if (trimmed.includes("@")) {
    return trimmed;
  }

  const user = await prisma.user.findFirst({
    where: {
      username: {
        equals: trimmed,
        mode: "insensitive",
      },
    },
    select: { email: true },
  });

  return user?.email ?? null;
}
