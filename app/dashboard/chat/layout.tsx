import { redirect } from "next/navigation"

/**
 * Chat desativado no lançamento: todas as rotas /dashboard/chat redirecionam para Odonto Vision.
 */
export default function ChatLayout({
  children: _children,
}: {
  children: React.ReactNode
}) {
  redirect("/dashboard/odonto-vision")
}
