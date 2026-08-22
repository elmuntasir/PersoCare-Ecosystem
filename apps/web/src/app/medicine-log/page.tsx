import { redirect } from "next/navigation";

export default function MedicineLogRedirectPage() {
  redirect("/dashboard/medicine");
}
