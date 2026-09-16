// types/next-auth.d.ts
import type { DefaultSession } from "next-auth";
import type { Role } from "@/auth/permissions";

declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
