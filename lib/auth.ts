// lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from './mongodb';
import { ROLES, hasPermission } from './authUtils';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // เชื่อมต่อ Database
          await connectDB();
          
          // ค้นหาผู้ใช้ในฐานข้อมูล
          const user = await User.findOne({ username: credentials.username });
          
          if (!user) {
            return null;
          }
          
          // ตรวจสอบรหัสผ่าน
          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.password
          );
          
          if (!isPasswordCorrect) {
            return null;
          }
          
          // ส่งข้อมูลผู้ใช้กลับ
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role
          };
        } catch (error) {
          console.error('Authorization Error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1 วัน
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-fallback-secret-but-please-use-env'
};

// เพิ่มฟังก์ชันสำหรับตรวจสอบสิทธิ์
export function checkUserPermission(session: any, permission: string): boolean {
  if (!session || !session.user || !session.user.role) {
    return false;
  }
  
  return hasPermission(session.user.role, permission);
}

// เพิ่ม Type สำหรับ session
declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
    };
  }
}