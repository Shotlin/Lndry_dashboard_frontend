import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that don't require full authentication
const PUBLIC_ROUTES = ["/login"] as const
const MFA_ROUTES = ["/login/verify-2fa", "/login/recovery"] as const
const PASSWORD_CHANGE_ROUTES = ["/change-password"] as const

const COOKIE_AUTH_SESSION = "auth_session"
const COOKIE_MFA_PENDING = "mfa_pending"
const COOKIE_PASSWORD_CHANGE_REQUIRED = "password_change_required"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip Next.js internals, static files, and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  const hasAuth = request.cookies.has(COOKIE_AUTH_SESSION)
  const isMfaPending = request.cookies.get(COOKIE_MFA_PENDING)?.value === "1"
  const isPasswordChangeRequired = request.cookies.get(COOKIE_PASSWORD_CHANGE_REQUIRED)?.value === "1"

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  const isMfaRoute = MFA_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  const isPwdRoute = PASSWORD_CHANGE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))

  // 1. Unauthenticated state
  if (!hasAuth) {
    if (!isPublicRoute && !isMfaRoute) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // 2. Authenticated but MFA is pending
  if (isMfaPending) {
    if (!isMfaRoute && pathname !== "/login") {
      return NextResponse.redirect(new URL("/login/verify-2fa", request.url))
    }
    return NextResponse.next()
  }

  // 3. Authenticated, MFA done, but forced password change is active
  if (isPasswordChangeRequired) {
    if (!isPwdRoute && pathname !== "/logout") {
      return NextResponse.redirect(new URL("/change-password", request.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
