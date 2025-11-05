import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  console.log("[v0] Middleware: Processing request for", request.nextUrl.pathname)

  // For now, just allow all requests through to debug the preview issue
  // We'll add back authentication checks once the app is loading
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
