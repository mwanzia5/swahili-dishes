import { createAuthActions } from "@insforge/sdk/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const codeVerifier = searchParams.get("code_verifier");
  const next = searchParams.get("next") ?? "/account";

  if (!code) {
    return new Response("Missing authorization code", { status: 400 });
  }

  const auth = createAuthActions({ cookies: await cookies() });
  const { data, error } = await auth.exchangeOAuthCode(code, codeVerifier ?? undefined);

  if (error || !data) {
    console.error("OAuth callback error:", error);
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "OAuth failed")}`);
  }

  redirect(next);
}