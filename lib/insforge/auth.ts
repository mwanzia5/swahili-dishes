import { cookies } from "next/headers";
import { createAuthActions, type AuthActions } from "@insforge/sdk/ssr";

/**
 * Returns a server-side auth actions object.  Call this inside Server Actions
 * or Route Handlers — never from a Client Component.
 *
 * Usage:
 *   const auth = await getAuthActions()
 *   const { data, error } = await auth.signInWithPassword({ email, password })
 */
export async function getAuthActions(): Promise<AuthActions> {
  const cookieStore = await cookies();
  return createAuthActions({ cookies: cookieStore });
}