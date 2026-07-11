import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcrypt-ts";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize({ email, password }) {
        try {
          const user = await prisma.user.findUnique({
            where: { email: email as string },
          });
          if (!user) { console.log("[auth] user not found:", email); return null; }
          const valid = await compare(password as string, user.hashedPassword);
          if (!valid) { console.log("[auth] password mismatch"); return null; }
          return { id: user.id, email: user.email };
        } catch (err) {
          console.log("[auth] error:", err);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth: session }) {
      return !!session?.user;
    },
  },
});
