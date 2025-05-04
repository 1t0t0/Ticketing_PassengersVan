import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Check if user is authenticated
    const token = req.nextauth.token;
    
    // If not authenticated, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    
    // Check role-based access
    const path = req.nextUrl.pathname;
    
    // Driver can only access driver portal
    if (token.role === "driver" && !path.startsWith("/driver-portal")) {
      return NextResponse.redirect(new URL("/driver-portal", req.url));
    }
    
    // Staff and admin cannot access driver portal
    if ((token.role === "staff" || token.role === "admin") && path.startsWith("/driver-portal")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/driver-portal/:path*",
  ],
};