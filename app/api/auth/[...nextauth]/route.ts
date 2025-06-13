// app/api/auth/[...nextauth]/route.ts - Updated for phone-based authentication
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// สร้าง interface สำหรับ extended session user
interface ExtendedSessionUser {
  id: string;
  email?: string;
  phone: string;
  name?: string | null;
  role: string;
  driverId?: string;
  image?: string | null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error("Please enter phone number and password");
        }

        await connectDB();
        
        // Clean phone number (remove any formatting)
        const cleanPhone = credentials.phone.replace(/\D/g, '');
        
        // Find user by phone number
        const user = await User.findOne({ phone: cleanPhone });

        if (!user || !await bcrypt.compare(credentials.password, user.password)) {
          throw new Error("Invalid phone number or password");
        }

        return {
          id: user._id.toString(),
          phone: user.phone,
          email: user.email, // Keep email as optional for compatibility
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.phone = user.phone;
        token.email = user.email; // Keep for compatibility
      }
      console.log('JWT Token:', token); // เพิ่ม log เพื่อ debug
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.phone = token.phone as string;
        
        // Keep email if available for compatibility
        if (token.email) {
          session.user.email = token.email as string;
        }
      }
      console.log('Session:', session); // เพิ่ม log เพื่อ debug
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };