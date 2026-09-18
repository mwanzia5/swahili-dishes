import { Suspense } from "react";
import { AuthForm } from "components/auth/auth-form";

export const metadata = {
  title: "Sign In",
  description: "Sign in to your Swahili Dishes account.",
};

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-200px)]">
      <Suspense fallback={<div className="text-center text-cream-300 py-24">Loading...</div>}>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}