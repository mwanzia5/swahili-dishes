import { createServerClient } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";

/**
 * Returns an InsForge server client whose credentials are driven by the
 * current request/response cookie pair. Use this in Server Components,
 * Server Actions, and Route Handlers.
 */
export async function createInsForgeServerClient() {
  return createServerClient({
    cookies: await cookies(),
  });
}