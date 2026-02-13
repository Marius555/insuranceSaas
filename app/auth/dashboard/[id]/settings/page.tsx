import { redirect } from "next/navigation"

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/auth/dashboard/${id}/settings/general`)
}
