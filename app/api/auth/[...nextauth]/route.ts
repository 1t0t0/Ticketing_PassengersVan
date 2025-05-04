// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Driver from "@/models/Driver";
import bcrypt from "bcryptjs";

// สร้าง interface สำหรับ extended session user
interface ExtendedSessionUser {
  id: string;
  email: string;
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
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter email and password");
        }

        await connectDB();
        const user = await User.findOne({ email: credentials.email });

        if (!user || !await bcrypt.compare(credentials.password, user.password)) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user._id.toString(),
          email: user.email,
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
        
        // ถ้าเป็น driver ให้ดึง driver ID มาด้วย
        if (user.role === 'driver') {
          await connectDB();
          const driver = await Driver.findOne({ userId: user.id });
          if (driver) {
            token.driverId = driver._id.toString();
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        // Type assertion with proper interface
        const extendedUser = session.user as ExtendedSessionUser;
        extendedUser.role = token.role as string;
        extendedUser.id = token.id as string;
        
        if (token.driverId) {
          extendedUser.driverId = token.driverId as string;
        }
      }
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