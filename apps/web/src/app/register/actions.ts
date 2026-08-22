"use server";

import { prisma } from "@/lib/prisma";
import { type SignupRole } from "./constants";

export { type SignupRole } from "./constants";

const PROFESSION_ROLES: ReadonlySet<SignupRole> = new Set([
  "doctor",
  "nutritionist",
  "trainer",
]);

const PROFESSION_LABELS: Record<string, string> = {
  doctor: "Doctor",
  nutritionist: "Nutritionist",
  trainer: "Trainer",
};

export type CreatePatientAccountInput = {
  authId: string;
  name: string;
  email: string;
  username?: string;
  phone: string;
  dob: string; // yyyy-mm-dd from <input type="date">
  gender: string;
  role: SignupRole;
};

export type CreatePatientAccountResult =
  | { ok: true; pendingVerification: boolean }
  | { ok: false; error: string };

export async function createPatientAccount(
  input: CreatePatientAccountInput
): Promise<CreatePatientAccountResult> {
  const { authId, name, email, username, phone, dob, gender, role } = input;

  if (!authId || !name.trim() || !email.trim()) {
    return { ok: false, error: "Missing required fields." };
  }

  try {
    const user = await prisma.user.create({
      data: {
        authId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        username: username?.trim().toLowerCase() || null,
        phone: phone.trim() || null,
        dob: dob ? new Date(dob) : null,
        gender: gender || null,
        requestedRole: role,
      },
    });

    const pendingVerification = PROFESSION_ROLES.has(role);

    if (pendingVerification) {
      const code = role.toUpperCase();
      const professionType = await prisma.professionType.upsert({
        where: { code },
        update: {},
        create: {
          code,
          name: PROFESSION_LABELS[role],
        },
      });

      await prisma.userProfession.create({
        data: {
          userId: user.id,
          professionTypeId: professionType.id,
          status: "PENDING",
        },
      });
    }

    return { ok: true, pendingVerification };
  } catch (err: unknown) {
    // Prisma unique constraint violation
    const code = (err as { code?: string })?.code;
    if (code === "P2002") {
      return {
        ok: false,
        error: "An account with this email already exists.",
      };
    }
    console.error("createPatientAccount failed:", err);
    return { ok: false, error: "Couldn't finish creating your profile." };
  }
}
