import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import { compare } from "bcrypt";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
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
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
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
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.imageUrl = token.imageUrl as string;
        session.user.course = token.course as any;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.imageUrl = user.imageUrl;
        token.course = user.course;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  debug: process.env.NODE_ENV === 'development',
};

declare module "next-auth" {
  interface Session {
    user: {
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
    };
  }
}
