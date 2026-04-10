import { redirect } from "next/navigation"

/**
 * Chat desativado no lançamento: todas as rotas /dashboard/chat redirecionam para Med Vision.
 */
export default function ChatLayout({
  children: _children,
}: {
  children: React.ReactNode
}) {
  redirect("/dashboard/odonto-vision")
}
