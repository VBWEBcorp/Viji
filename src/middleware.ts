import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  (process.env.NODE_ENV !== "production"
    ? "dev-only-insecure-secret-replace-in-prod"
    : undefined);

export async function middleware(req: NextRequest) {
  // En prod (HTTPS), Auth.js v5 préfixe le cookie de session : `__Secure-authjs.session-token`.
  // getToken doit donc savoir s'il faut chercher le cookie sécurisé, sinon il ne trouve jamais
  // le token et toutes les routes /admin sont rejetées vers /login.
  const secureCookie =
    process.env.NODE_ENV === "production" || req.nextUrl.protocol === "https:";
  const token = await getToken({ req, secret: AUTH_SECRET, secureCookie });
  const { pathname } = req.nextUrl;

  // Protection des routes admin
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (token.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protection des routes account
  if (pathname.startsWith("/account")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
