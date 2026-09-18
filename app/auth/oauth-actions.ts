"use server";

import { signInWithOAuth } from "app/auth/actions";

export async function initiateGoogleOAuth(_formData: FormData) {
  await signInWithOAuth("google");
}