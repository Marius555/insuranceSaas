export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex-1 min-w-0 flex flex-col">{children}</div>;
}
