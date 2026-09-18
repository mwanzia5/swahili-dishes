"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthActions, createServerClient } from "@insforge/sdk/ssr";
import { getAdminClient } from "lib/insforge/admin";

export type AuthActionResult = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * Allows only internal absolute paths (e.g. "/admin") to guard the
 * post-login redirect against open-redirect abuse.
 */
function safeNextPath(raw: string): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export async function signIn(
  prevState: AuthActionResult | undefined,
  formData: FormData,
): Promise<AuthActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!validateEmail(email)) {
    return { fieldErrors: { email: "Enter a valid email address." } };
  }
  if (!password) {
    return { fieldErrors: { password: "Enter your password." } };
  }

  const auth = createAuthActions({ cookies: await cookies() });
  const { data, error } = await auth.signInWithPassword({ email, password });

  if (error || !data?.user) {
    return { error: error?.message ?? "Sign in failed. Check your email and password." };
  }

  // Link the anonymous cart (if any) to this user
  await linkSessionCart(data.user.id);

  const next = String(formData.get("next") ?? "").trim();
  redirect(safeNextPath(next) ?? "/account");
}

export async function signUp(
  prevState: AuthActionResult | undefined,
  formData: FormData,
): Promise<AuthActionResult> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  const fieldErrors: Record<string, string> = {};
  if (fullName.length < 2) fieldErrors.fullName = "Enter your full name.";
  if (!validateEmail(email)) fieldErrors.email = "Enter a valid email address.";
  if (!validatePassword(password)) fieldErrors.password = "Password must be at least 8 characters.";
  if (password !== confirm) fieldErrors.confirmPassword = "Passwords do not match.";
  if (phone && !/^(\+\d{1,3}[- ]?)?\d{9,12}$/.test(phone)) {
    fieldErrors.phone = "Enter a valid phone number.";
  }
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const auth = createAuthActions({ cookies: await cookies() });
  const { data, error } = await auth.signUp({ email, password });

  if (error || !data?.user) {
    console.error("SignUp error:", error);
    return { error: error?.message ?? "Could not create your account. Try again." };
  }

  // Create the profile row
  const admin = getAdminClient();
  await admin.database.from("profiles").upsert({
    id: data.user.id,
    full_name: fullName,
    email,
    phone: phone || null,
    role: "CUSTOMER",
  }, { onConflict: "id" });

  await linkSessionCart(data.user.id);

  redirect("/account");
}

export async function signOut(): Promise<void> {
  const auth = createAuthActions({ cookies: await cookies() });
  await auth.signOut();
  redirect("/");
}

export async function signInWithOAuth(provider: string) {
  const auth = createAuthActions({ cookies: await cookies() });
  const { data, error } = await auth.signInWithOAuth(provider, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  });

  if (error) {
    return { error: error.message };
  }

  if (data?.url) {
    redirect(data.url);
  }

  return { error: "Failed to initiate OAuth flow" };
}

/**
 * If the guest cart (session_token) has items, move them to the user's
 * authenticated cart after sign-in / sign-up.
 */
async function linkSessionCart(userId: string): Promise<void> {
  try {
    const store = await cookies();
    const sessionToken = store.get("swahili_session")?.value;
    if (!sessionToken) return;

    const admin = getAdminClient();

    const { data: guestCart } = await admin.database
      .from("carts")
      .select("id")
      .eq("session_token", sessionToken)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (!guestCart) return;

    const { data: userCart } = await admin.database
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (!userCart) {
      // Assign the guest cart to this user
      await admin.database
        .from("carts")
        .update({ user_id: userId, session_token: null })
        .eq("id", guestCart.id);
    } else {
      // Merge guest items into user cart
      const { data: guestItems } = await admin.database
        .from("cart_items")
        .select("*")
        .eq("cart_id", guestCart.id);

      if (guestItems) {
        for (const item of guestItems) {
          const { data: existing } = await admin.database
            .from("cart_items")
            .select("id, quantity")
            .eq("cart_id", userCart.id)
            .eq("product_id", item.product_id)
            .maybeSingle();

          if (existing) {
            await admin.database
              .from("cart_items")
              .update({ quantity: existing.quantity + item.quantity })
              .eq("id", existing.id);
          } else {
            await admin.database
              .from("cart_items")
              .insert({
                cart_id: userCart.id,
                product_id: item.product_id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                extras: item.extras,
                notes: item.notes,
              });
          }
        }
      }
      // Deactivate the guest cart
      await admin.database.from("carts").update({ status: "ABANDONED" }).eq("id", guestCart.id);
    }

    store.delete("swahili_session");
    store.set("swahili_user_id", userId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  } catch (e) {
    console.error("linkSessionCart error:", e);
  }
}

/**
 * Read the current authenticated user's server-side session (safe data only).
 * For use in Server Components / RSC payloads. In Server Actions, prefer the
 * `createAuthActions` mutation methods.
 *
 * NOTE: no try/catch here — `cookies()` throws React's special "bail out of
 * prerendering" sentinel during static generation, and swallowing it breaks PPR.
 */
export async function getSessionUser() {
  const client = createServerClient({ cookies: await cookies() });
  const { data, error } = await client.auth.getCurrentUser();
  if (error || !data?.user) return null;
  return data.user as { id: string; email?: string } | null;
}