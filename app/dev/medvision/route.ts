import { NextResponse } from "next/server"

import { DEV_BYPASS_COOKIE_NAME, isDevEnvironment } from "@/lib/dev-auth"

/**
 * Em `next dev`, define cookie de bypass e redireciona ao MedVision.
 * Não depende de variáveis de ambiente no Edge (problema comum com `.env.local`).
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin

  if (!isDevEnvironment()) {
    return NextResponse.redirect(
      new URL("/login?redirectTo=/dashboard/odonto-vision", origin),
    )
  }

  const res = NextResponse.redirect(new URL("/dashboard/odonto-vision", origin))
  res.cookies.set(DEV_BYPASS_COOKIE_NAME, "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
  })
  return res
}
