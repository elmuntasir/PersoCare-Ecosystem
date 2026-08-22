"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updatePersonalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
});

async function getAuthUser() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return null;
    return await prisma.user.findUnique({ where: { authId: authUser.id } });
  } catch {
    return null;
  }
}

export async function updatePersonalInfo(formData: FormData) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string | null;
  const dob = formData.get("dob") as string | null;
  const gender = formData.get("gender") as string | null;
  const username = formData.get("username") as string | null;

  const data = updatePersonalSchema.parse({
    name,
    phone: phone?.trim() || null,
    dob: dob?.trim() || null,
    gender: gender?.trim() || null,
    username: username?.trim() || null,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: data.name,
      phone: data.phone,
      dob: data.dob ? new Date(data.dob) : null,
      gender: data.gender,
      username: data.username,
    },
  });

  revalidatePath("/dashboard/profile");
  return { success: true };
}
