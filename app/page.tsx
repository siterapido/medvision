import { redirect } from "next/navigation"

export default function Home() {
  console.log("[v0] Home page rendering - redirecting to login")
  // Redirect to login page
  redirect("/login")
}
