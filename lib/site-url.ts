/**
 * URL pública da aplicação (callbacks de auth, links em e-mails, etc.).
 * Configure NEXT_PUBLIC_SITE_URL (e/ou APP_URL) no novo projeto Supabase/Vercel.
 */
export function getPublicSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
  return raw.replace(/\/$/, "")
}
