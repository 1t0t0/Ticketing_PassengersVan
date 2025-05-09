import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    // ถ้าไม่มี token ให้ redirect ไปหน้า login
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    
    // ถ้าเป็น driver และพยายามเข้าหน้าอื่นที่ไม่ใช่ driver-portal
    if (token.role === "driver") {
      if (!path.startsWith("/driver-portal")) {
        return NextResponse.redirect(new URL("/driver-portal", req.url));
      }
    }
    
    // ถ้าเป็น staff
    if (token.role === "staff") {
      // Staff สามารถเข้าถึงได้เฉพาะหน้า tickets และ users (เพิ่มสิทธิ์ให้เข้าถึง users ได้)
      const allowedStaffPaths = [
        "/dashboard/tickets",
        "/dashboard/users", // อนุญาตให้ Staff เข้าถึงหน้า User Management ได้
      ];

      // ถ้า path เริ่มต้นด้วย /dashboard แต่ไม่ได้อยู่ใน allowedStaffPaths
      if (path.startsWith("/dashboard") && !allowedStaffPaths.some(allowedPath => path.startsWith(allowedPath))) {
        // ให้ redirect ไปที่หน้า tickets
        return NextResponse.redirect(new URL("/dashboard/tickets", req.url));
      }
    }
    
    // ถ้าเป็น station และพยายามเข้าหน้าที่ไม่ได้รับอนุญาต
    if (token.role === "station") {
      // Station สามารถเข้าถึงได้เฉพาะหน้า revenue และ dashboard หลัก
      const allowedStationPaths = [
        "/dashboard",
        "/dashboard/revenue",
        "/dashboard/tickets/history"
      ];

      // ถ้า path เริ่มต้นด้วย /dashboard แต่ไม่ได้อยู่ใน allowedStationPaths
      if (path.startsWith("/dashboard") && !allowedStationPaths.some(allowedPath => path.startsWith(allowedPath))) {
        // ให้ redirect ไปที่หน้า dashboard
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
    
    // ป้องกันไม่ให้ staff และ station เข้าถึงหน้าที่ไม่ได้รับอนุญาต
    if ((token.role === "staff" || token.role === "station") && path.startsWith("/driver-portal")) {
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

// กำหนด path ที่ต้องการ protect
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/driver-portal/:path*",
  ],
};