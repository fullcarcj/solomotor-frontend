import { redirect } from "next/navigation";

/** Legacy: unificado en `/dashboard`. */
export default function AdminDashboardTwoDeprecatedPage() {
  redirect("/dashboard");
}
