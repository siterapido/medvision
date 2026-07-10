import { redirect } from "next/navigation"

/** Alias legado — redireciona para a rota canônica Med Vision. */
export default function Page() {
  redirect("/dashboard/med-vision")
}
