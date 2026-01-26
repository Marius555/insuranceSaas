import { getSession } from "@/appwrite/getSession";
import { getUserDocument } from "@/appwrite/getUserDocument";
import { redirect } from "next/navigation";
import { UserProvider } from "@/lib/context/user-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboardComponents/app-sidebar";

interface ReportsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function ReportsLayout({ children, params }: ReportsLayoutProps) {
  const { id } = await params;

  const session = await getSession();
  if (!session) {
    redirect(`/?auth=required&returnTo=/auth/reports/${id}`);
  }

  const userDoc = await getUserDocument(session.id);

  const userData = {
    userId: session.id,
    email: userDoc?.email || '',
    role: userDoc?.role || 'user',
  };

  return (
    <UserProvider userData={userData}>
      <SidebarProvider>
        <AppSidebar />
        {children}
      </SidebarProvider>
    </UserProvider>
  );
}
