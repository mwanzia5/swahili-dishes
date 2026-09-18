"use client";

import { useState } from "react";

type ImageManagerProps = {
  productId: string;
  productName: string;
  currentImageUrl: string | null;
  onImageUpdated?: (newUrl: string) => void;
};

export function ProductImageManager({ productId, productName, currentImageUrl, onImageUpdated }: ImageManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(productName);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");

  async function searchImages() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setStatus("");
    try {
      const res = await fetch(`/api/admin/images/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.imageUrl) {
        setSearchResults([data.imageUrl]);
      } else {
        setStatus("No images found for this search");
        setSearchResults([]);
      }
    } catch {
      setStatus("Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function applyImage(url: string) {
    setStatus("");
    try {
      const res = await fetch("/api/admin/images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, image_url: url, alt_text: productName }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("Image updated!");
      onImageUpdated?.(url);
      setTimeout(() => setIsOpen(false), 1000);
    } catch {
      setStatus("Failed to update image");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setStatus("");

    try {
      // Convert to base64 data URL for storage
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Store as a simple URL (in production, upload to InsForge Storage or similar)
      // For now, we store the data URL directly
      const res = await fetch("/api/admin/images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, image_url: dataUrl, alt_text: productName }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("Image uploaded!");
      onImageUpdated?.(dataUrl);
      setTimeout(() => setIsOpen(false), 1000);
    } catch {
      setStatus("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs text-gold-400 hover:underline"
      >
        {currentImageUrl ? "Change image" : "Add image"}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-950 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-medium text-white">Manage Image</h3>
          <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-white">✕</button>
        </div>

        {/* Current image */}
        {currentImageUrl && (
          <div className="mb-4">
            <p className="mb-2 text-xs text-neutral-500">Current image</p>
            <img src={currentImageUrl} alt={productName} className="h-32 w-32 rounded-lg object-cover" />
          </div>
        )}

        {/* Search via Firecrawl */}
        <div className="mb-4">
          <p className="mb-2 text-xs text-neutral-400">Search for an image online</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchImages()}
              className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-gold-400"
              placeholder="Search dish name..."
            />
            <button
              onClick={searchImages}
              disabled={searching}
              className="rounded-lg bg-gold-400 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {searching ? "..." : "Search"}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {searchResults.map((url, i) => (
                <button key={i} onClick={() => applyImage(url)} className="group relative overflow-hidden rounded-lg border border-neutral-800 hover:border-gold-400">
                  <img src={url} alt="Search result" className="h-24 w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white opacity-0 group-hover:opacity-100">Use this</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* File upload */}
        <div>
          <p className="mb-2 text-xs text-neutral-400">Or upload from your device</p>
          <label className="flex w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-neutral-700 bg-neutral-900 px-4 py-6 text-sm text-neutral-400 hover:border-gold-400 hover:text-white">
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            {uploading ? "Uploading..." : "Click to upload image"}
          </label>
        </div>

        {/* Manual URL */}
        <div className="mt-4">
          <p className="mb-2 text-xs text-neutral-400">Or paste an image URL</p>
          <div className="flex gap-2">
            <input
              type="url"
              id="manual-url"
              className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-gold-400"
              placeholder="https://..."
            />
            <button
              onClick={() => {
                const url = (document.getElementById("manual-url") as HTMLInputElement)?.value;
                if (url) applyImage(url);
              }}
              className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-white hover:border-gold-400"
            >
              Apply
            </button>
          </div>
        </div>

        {status && <p className="mt-3 text-xs text-gold-400">{status}</p>}
      </div>
    </div>
  );
}
