import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getSessionSecret } from "./src/lib/getSessionSecret";

const protectedPrefixes = ["/admin", "/mentor", "/student", "/leaderboard"];
const secret = getSessionSecret();

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("session")?.value;

  // Note: /api routes are intentionally exempted from middleware enforcement here because
  // API handlers manage their own auth response formatting and MUST explicitly call requireApiUser().
  const isPublicPath =
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/uploads") ||
    pathname === "/favicon.ico";

  let userPayload = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
      });
      userPayload = payload;
    } catch (e) {
      // Invalid or expired token
    }
  }

  const isProtectedPath = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  // If path is protected and user is not logged in, redirect to login
  if (isProtectedPath && !isPublicPath && !userPayload) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Prevent role traversal / unauthorized dashboard access
  if (userPayload && !isPublicPath) {
    if (pathname.startsWith("/admin") && userPayload.role !== "ADMIN") {
      const target = userPayload.role === "MENTOR" ? "/mentor/review" : "/student/dashboard";
      return NextResponse.redirect(new URL(target, request.url));
    }
    if (pathname.startsWith("/mentor") && userPayload.role !== "MENTOR") {
      const target = userPayload.role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard";
      return NextResponse.redirect(new URL(target, request.url));
    }
    if (pathname.startsWith("/student") && userPayload.role !== "STUDENT") {
      const target = userPayload.role === "ADMIN" ? "/admin/dashboard" : "/mentor/review";
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return NextResponse.next();
}
