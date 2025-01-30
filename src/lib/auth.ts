import type { NextAuthOptions, Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import { compare } from "bcrypt";

// Extend the built-in User type to include our custom fields
interface CustomUser extends User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  imageUrl: string;
  course?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

// Ensure we have the required environment variables
const requiredEnvVars = ['NEXTAUTH_SECRET', 'DATABASE_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} environment variable is required`);
  }
}

// Set NEXTAUTH_URL in production
if (process.env.VERCEL_URL && !process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Sign in",
      credentials: {
        username: {
          label: "Username",
          type: "text",
          placeholder: "Enter your username",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              username: credentials.username,
            },
            include: {
              course: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          });

          if (!user) {
            console.log('User not found:', credentials.username);
            return null;
          }

          const isPasswordValid = await compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            console.log('Invalid password for user:', credentials.username);
            return null;
          }

          return {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            imageUrl: user.imageUrl,
            course: user.course,
            name: `${user.firstName} ${user.lastName}`,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.role = user.role;
        token.imageUrl = user.imageUrl;
        token.course = (user as CustomUser).course;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.email = token.email as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.role = token.role as string;
        session.user.imageUrl = token.imageUrl as string;
        session.user.course = token.course as CustomUser['course'];
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

declare module "next-auth" {
  interface Session {
    user: CustomUser;
  }
}
