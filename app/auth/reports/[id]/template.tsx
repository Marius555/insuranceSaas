export default function ReportsTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="animate-page-enter flex-1 min-w-0 flex flex-col">{children}</div>;
}
