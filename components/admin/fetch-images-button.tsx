"use client";

import { useState } from "react";
import { batchFetchProductImages } from "app/admin/actions";

export function FetchImagesButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ processed: number; updated: number; errors: string[] } | null>(null);

  async function handleFetch() {
    setLoading(true);
    setResult(null);
    try {
      const r = await batchFetchProductImages();
      setResult(r);
    } catch {
      setResult({ processed: 0, updated: 0, errors: ["Failed to run"] });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleFetch}
        disabled={loading}
        className="rounded-lg border border-gold-400/30 bg-gold-400/10 px-4 py-2 text-xs font-medium text-gold-400 transition hover:bg-gold-400/20 disabled:opacity-60"
      >
        {loading ? "Fetching..." : "Fetch Missing Images (Firecrawl)"}
      </button>
      {result && (
        <p className="mt-2 text-xs text-neutral-400">
          Processed {result.processed}, updated {result.updated}
          {result.errors.length > 0 && ` (${result.errors.length} errors)`}
        </p>
      )}
    </div>
  );
}
