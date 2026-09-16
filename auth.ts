// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/auth/permissions";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const username = String(credentials.username).trim().toLowerCase();
        const password = String(credentials.password);

        const user = await prisma.user.findUnique({
          where: { username },
        });

        // Spec §11, §12: Suspended and Deleted accounts cannot log in
        if (!user || user.status !== "ACTIVE") {
          return null;
        }

        // Check password (spec §10)
        if (user.passwordHash !== password) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          role: user.role as Role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
