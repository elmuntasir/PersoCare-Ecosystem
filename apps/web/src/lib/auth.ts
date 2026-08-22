import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return null;
    return await prisma.user.findUnique({
      where: { authId: authUser.id },
      include: {
        platformOwner: true,
      },
    });
  } catch {
    return null;
  }
}

export async function isPlatformOwner(userId: string): Promise<boolean> {
  if (!userId) return false;
  const owner = await prisma.platformOwner.findUnique({
    where: { userId },
  });
  return Boolean(owner);
}
