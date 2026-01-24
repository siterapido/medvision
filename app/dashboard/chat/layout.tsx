export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Chat layout is minimal - sidebar provides all navigation
  return <>{children}</>
}
