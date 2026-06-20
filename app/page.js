import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-server";
import { getDefaultHomeForRole } from "@/lib/permissions";

export default async function Home() {
  const session = await getAuthSession();
  if (session?.user?.role) {
    redirect(getDefaultHomeForRole(session.user.role));
  }
  redirect("/login");
}
