// types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      role: string;
      driverId?: string; // เพิ่ม field นี้
    } & DefaultSession["user"]
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    id?: string;
    driverId?: string; // เพิ่ม field นี้
  }
}