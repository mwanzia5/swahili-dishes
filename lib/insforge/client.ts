import { createBrowserClient } from "@insforge/sdk/ssr";

/**
 * Browser-side InsForge client. Manages access-token refresh through the
 * /api/auth/refresh endpoint and exposes read-only auth operations.
 * Auth mutations (sign-in, sign-up, sign-out) MUST run on the server via
 * createAuthActions().
 */
export const insforgeBrowser = createBrowserClient();