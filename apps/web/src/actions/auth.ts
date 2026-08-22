"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

// ─── Send Password Reset Email ─────────────────────────────

const resetEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

export async function sendPasswordResetEmail(formData: FormData) {
  const { email } = resetEmailSchema.parse({
    email: formData.get("email"),
  });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  if (error) {
    // Security best practice: don't reveal exact failure details
    return { success: true, message: "If an account exists, a reset link has been sent." };
  }

  return { success: true, message: "If an account exists, a reset link has been sent." };
}

// ─── Reset Password (using Supabase session) ──────────────

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export async function resetPassword(formData: FormData) {
  const { password } = resetPasswordSchema.parse({
    password: formData.get("password"),
  });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Update user's password using the session (user authenticated via reset token)
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { success: false, message: error.message || "Failed to reset password. Please try again." };
  }

  revalidatePath("/login");
  return { success: true, message: "Password reset successfully!" };
}
