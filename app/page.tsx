import { getCurrentUser } from "@/lib/auth/session";
import { getDefaultRouteForRole } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(getDefaultRouteForRole(user.role));
  } else {
    redirect("/login");
  }
}
