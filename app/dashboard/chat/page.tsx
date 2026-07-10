import { UnavailablePage } from "@/components/unavailable-page"

export const metadata = {
  title: "Página não encontrada | MedVision",
  description: "Esta página não está disponível no fluxo clínico atual.",
}

export default function ChatPage() {
  return <UnavailablePage />
}
