import { redirect } from "next/navigation";

export default async function HealthDiaryPage() {
  redirect("/dashboard/log-history");
}
