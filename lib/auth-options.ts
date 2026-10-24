import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const emailInput = credentials?.email;
        const password = credentials?.password;
        if (typeof emailInput !== "string" || typeof password !== "string") {
          return null;
        }

        const email = emailInput.trim().toLowerCase();
        if (
          email.length > 255 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
          password.length === 0 ||
          Buffer.byteLength(password, "utf8") > 72
        ) {
          return null;
        }

        const users = await prisma.user.findMany({
          where: { email },
          select: {
            id: true,
            email: true,
            full_name: true,
            avatar_url: true,
            password_hash: true,
          },
          take: 2,
        });

        if (users.length !== 1) {
          return null;
        }

        const user = users[0];
        if (!user || !user.password_hash) {
          return null;
        }

        const passwordHash = user.password_hash;
        let passwordMatches = false;
        try {
          passwordMatches = await new Promise<boolean>((resolve, reject) => {
            compare(password, passwordHash, (error, matches) => {
              if (error) {
                reject(error);
              } else {
                resolve(matches ?? false);
              }
            });
          });
        } catch (cause: unknown) {
          console.error("Failed to verify stored password hash.", cause);
          return null;
        }

        if (!passwordMatches) {
          return null;
        }

        return {
          id: String(user.id),
          email: user.email,
          name: user.full_name,
          image: user.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};
