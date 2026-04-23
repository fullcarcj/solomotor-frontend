import { redirect } from "next/navigation";

/** Legacy: la app canónica vive en `/dashboard`. */
export default function AdminDashboardDeprecatedPage() {
  redirect("/dashboard");
}
