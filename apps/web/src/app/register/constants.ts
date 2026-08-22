/**
 * Public sign-up roles — kept in a plain (non-server) module so both
 * the client-side page and the server action can import from here.
 * "admin" is intentionally absent: platform-owner accounts are
 * provisioned internally, never through public registration.
 */
export const SIGNUP_ROLES = [
  { value: "patient", label: "Patient" },
  { value: "doctor", label: "Doctor / Healthcare Professional" },
  { value: "nutritionist", label: "Nutritionist" },
  { value: "trainer", label: "Trainer" },
  { value: "family_member", label: "Family Member" },
  { value: "caregiver", label: "Caregiver" },
] as const;

export type SignupRole = (typeof SIGNUP_ROLES)[number]["value"];
