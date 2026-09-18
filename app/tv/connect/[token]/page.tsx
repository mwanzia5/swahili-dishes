"use client";

import { use, useEffect, useState } from "react";

export default function TVConnectPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    async function connect() {
      try {
        const res = await fetch("/api/crm/tv/pair", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pairing_token: token }),
        });

        if (!res.ok) throw new Error("Invalid or expired");
        setStatus("success");
      } catch {
        setStatus("error");
      }
    }
    connect();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md text-center">
        {status === "loading" && (
          <>
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-neutral-700 border-t-gold-400" />
            <p className="text-sm text-neutral-400">Connecting to your TV session...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <span className="text-3xl text-green-400">&#10003;</span>
            </div>
            <h1 className="text-xl font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
              Connected!
            </h1>
            <p className="mt-2 text-sm text-neutral-400">
              Your phone is now linked to your TV session. Browse recipes and products here.
            </p>
            <a
              href="/recipes"
              className="mt-6 inline-block rounded-full bg-[var(--color-gold-400)] px-6 py-3 text-sm font-medium text-white hover:opacity-90"
            >
              Browse Recipes
            </a>
          </>
        )}
        {status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <span className="text-3xl text-red-400">&#10005;</span>
            </div>
            <h1 className="text-xl font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
              Connection Failed
            </h1>
            <p className="mt-2 text-sm text-neutral-400">
              This QR code has expired or is invalid. Please scan a new code from your TV.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
