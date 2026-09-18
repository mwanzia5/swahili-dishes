import { Suspense } from "react";
import { AuthForm } from "components/auth/auth-form";

export const metadata = {
  title: "Create Account",
  description: "Create your Swahili Dishes account.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-200px)]">
      <Suspense fallback={<div className="text-center text-cream-300 py-24">Loading...</div>}>
        <AuthForm mode="register" />
      </Suspense>
    </div>
  );
}