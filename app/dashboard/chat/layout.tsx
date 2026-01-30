export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Chat layout needs full height for proper chat display
  return (
    <div className="flex flex-col h-full overflow-y-auto md:overflow-hidden">
      {children}
    </div>
  )
}
