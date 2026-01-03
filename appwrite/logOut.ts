"use server"
import { clientAction } from "./adminOrClient";
import { isAppwriteClient } from "@/lib/types/appwrite";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface LogoutResponse {
  success: boolean;
  message: string;
}

export async function LogoutUser(): Promise<LogoutResponse> {
    const cookieStore = await cookies();
    try {
        const sessionClient = await clientAction();

        // Delete the current session from Appwrite if client action succeeded
        if (isAppwriteClient(sessionClient)) {
            await sessionClient.account.deleteSession('current');
        }

        cookieStore.delete("appSession");
        cookieStore.delete("localSession");

        return { success: true, message: "Logged out successfully" };
    } catch {
        cookieStore.delete("appSession");
        cookieStore.delete("localSession");
        return { success: true, message: "Logged out successfully" };
    }
}

export async function LogoutAndRedirect(): Promise<never> {
    await LogoutUser();
    redirect('/');
}
