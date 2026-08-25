"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const feeSchema = z.object({
  scheduleId: z.string().min(1, "Schedule ID is required"),
  consultationFee: z.number().min(0, "Fee cannot be negative").nullable(),
});

export async function setConsultationFee(formData: FormData) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const rawFee = formData.get("consultationFee");
  const parsedFee =
    rawFee !== null && rawFee !== "" && !Number.isNaN(Number(rawFee))
      ? Number(rawFee)
      : null;

  const { scheduleId, consultationFee } = feeSchema.parse({
    scheduleId: formData.get("scheduleId"),
    consultationFee: parsedFee,
  });

  // Verify schedule exists
  const schedule = await prisma.doctorSchedule.findUnique({
    where: { id: scheduleId },
    select: { organizationId: true, doctorUserId: true },
  });
  if (!schedule) throw new Error("Schedule not found");

  // Verify caller is admin of this organization OR the doctor themselves
  const isAdmin = await prisma.organizationAdmin.findFirst({
    where: {
      userId: user.id,
      organizationId: schedule.organizationId,
      isActive: true,
    },
  });

  const isDoctor = schedule.doctorUserId === user.id;

  if (!isAdmin && !isDoctor) {
    throw new Error("Unauthorized – Admin or Doctor access required to update fee");
  }

  await prisma.doctorSchedule.update({
    where: { id: scheduleId },
    data: { consultationFee },
  });

  revalidatePath(`/admin/manage/edit/${schedule.organizationId}`);
  revalidatePath("/admin/employees");
  revalidatePath("/dashboard/organization");
  revalidatePath("/dashboard/doctor/schedule");
  revalidatePath("/dashboard/appointments");

  return { success: true };
}
