import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { prisma } from "@/lib/prisma";

const googleCredentials =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : [];

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
    ...googleCredentials,
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
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") {
        return true;
      }

      const email = user.email?.trim().toLowerCase();
      if (
        !email ||
        !profile ||
        !("email_verified" in profile) ||
        profile.email_verified !== true
      ) {
        return false;
      }

      const matchingUsers = await prisma.user.findMany({
        where: { email },
        select: {
          id: true,
          email: true,
          full_name: true,
          avatar_url: true,
        },
        take: 2,
      });

      if (matchingUsers.length > 1) {
        console.error(
          "Google sign-in rejected because multiple local users share an email.",
        );
        return false;
      }
      const existingUser = matchingUsers[0];
      const googleName = user.name?.trim().slice(0, 255) || null;
      const googleImage = user.image || null;
      const localUser = existingUser
        ? await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              full_name: existingUser.full_name ?? googleName,
              avatar_url: googleImage ?? existingUser.avatar_url,
            },
            select: {
              id: true,
              email: true,
              full_name: true,
              avatar_url: true,
            },
          })
        : await prisma.user.create({
            data: {
              email,
              full_name: googleName,
              avatar_url: googleImage,
            },
            select: {
              id: true,
              email: true,
              full_name: true,
              avatar_url: true,
            },
          });

      user.id = String(localUser.id);
      user.email = localUser.email;
      user.name = localUser.full_name;
      user.image = localUser.avatar_url;
      return true;
    },
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
