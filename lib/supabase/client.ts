import { createBrowserClient } from "@supabase/ssr"

// Singleton instance
let client: ReturnType<typeof createBrowserClient> | null = null

/**
 * Creates a Supabase client for browser/client-side use
 *
 * IMPORTANT: This function should only be called from client components ('use client')
 * For server-side code, use createClient from '@/lib/supabase/server'
 */
export function createClient() {
  // Return cached client if exists
  if (client) {
    return client
  }

  // Access environment variables - these are replaced at build time by Next.js
  // Make sure to restart dev server after changing these values in .env.local
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Validate environment variables are present
  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = [
      "[Supabase Client] Missing required environment variables:",
      !supabaseUrl && "  - NEXT_PUBLIC_SUPABASE_URL is not defined",
      !supabaseAnonKey && "  - NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined",
      "",
      "To fix this:",
      "  1. Make sure .env.local exists in the project root",
      "  2. Add the missing variables to .env.local",
      "  3. Restart the development server (npm run dev)",
    ].filter(Boolean).join("\n")

    console.error(errorMsg)

    throw new Error(
      "Missing Supabase environment variables. Check the console for details."
    )
  }

  // Create and cache the client
  client = createBrowserClient(supabaseUrl, supabaseAnonKey)

  return client
}
