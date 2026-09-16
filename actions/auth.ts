// actions/auth.ts
"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { loginSchema } from "@/lib/zod-schemas";

export type LoginActionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

/**
 * Common login action without role pickers (§10).
 * Validates credentials and routes authenticated users directly to /schedule.
 */
export async function loginAction(
  rawInput: unknown
): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Champs invalides",
    };
  }

  try {
    await signIn("credentials", {
      username: parsed.data.username,
      password: parsed.data.password,
      redirect: false,
    });

    return { ok: true, redirectTo: "/schedule" };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            ok: false,
            error: "Identifiant ou mot de passe incorrect (ou compte suspendu / supprimé).",
          };
        default:
          return {
            ok: false,
            error: "Une erreur est survenue lors de l'authentification.",
          };
      }
    }

    // In Next.js redirect thrown inside Server Action
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      (error as { message: string }).message === "NEXT_REDIRECT"
    ) {
      return { ok: true, redirectTo: "/schedule" };
    }

    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erreur de connexion",
    };
  }
}
