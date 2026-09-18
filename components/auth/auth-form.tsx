"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, signUp } from "app/auth/actions";
import { initiateGoogleOAuth } from "app/auth/oauth-actions";
import type { AuthActionResult } from "app/auth/actions";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const [state, formAction, isPending] = useActionState<
    AuthActionResult | undefined,
    FormData
  >(isLogin ? signIn : signUp, undefined);

  const fieldError = (key: string) =>
    state?.fieldErrors?.[key] ? (
      <p className="mt-1 text-sm text-red-400">{state.fieldErrors[key]}</p>
    ) : null;

  const inputBase =
    "w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-white placeholder-cream-300/50 outline-none transition focus:border-[var(--color-gold-400)]";

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-8">
        <h1 className="mb-1 text-2xl font-semibold text-white">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mb-6 text-sm text-neutral-500">
          {isLogin
            ? "Sign in to track orders, save favourites and pay faster."
            : "Join Swahili Dishes for a personalized food experience."}
        </p>

<form action={formAction} className="space-y-4">
          {nextPath ? (
            <input type="hidden" name="next" value={nextPath} />
          ) : null}
          {!isLogin && (
            <>
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-1 block text-sm text-neutral-400"
                >
                  Full name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  className={inputBase}
                  placeholder="Ali Hassan"
                  required
                />
                {fieldError("fullName")}
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="mb-1 block text-sm text-neutral-400"
                >
                  Phone (optional)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className={inputBase}
                  placeholder="+254 712 345 678"
                />
                {fieldError("phone")}
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm text-neutral-400"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className={inputBase}
              placeholder="you@example.com"
              required
            />
            {fieldError("email")}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm text-neutral-400"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              className={inputBase}
              placeholder={isLogin ? "Your password" : "At least 8 characters"}
              required
              minLength={isLogin ? 1 : 8}
            />
            {fieldError("password")}
          </div>

          {!isLogin && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm text-neutral-400"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                className={inputBase}
                placeholder="Repeat your password"
                required
                minLength={8}
              />
              {fieldError("confirmPassword")}
            </div>
          )}

          {state?.error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-[var(--color-gold-400)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isPending
              ? isLogin
                ? "Signing in..."
                : "Creating account..."
              : isLogin
              ? "Sign in"
              : "Create account"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 border-t border-neutral-800" />
          <span className="text-sm text-neutral-500">or continue with</span>
          <div className="flex-1 border-t border-neutral-800" />
        </div>

        <form action={initiateGoogleOAuth}>
          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:border-[var(--color-gold-400)] disabled:opacity-60"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          {isLogin ? (
            <>
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-[var(--color-gold-400)] hover:underline"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-[var(--color-gold-400)] hover:underline"
              >
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}