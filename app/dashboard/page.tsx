import { getSession } from "@/appwrite/getSession";
import { redirect } from "next/navigation";

export default async function DashboardRedirect() {
  const session = await getSession();

  if (!session) {
    redirect("/?auth=required");
  }

  // Redirect to the new authenticated dashboard
  redirect(`/auth/dashboard/${session.id}`);
}
