#!/usr/bin/env node
/**
 * Download dish images from Unsplash for Swahili Dishes.
 * Usage: node scripts/download-dish-images.mjs
 */
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const OUT_DIR = path.resolve("public/images/dishes");

const DISHES = [
  // Verified Unsplash photo IDs matching Swahili food names
  { name: "pilau", id: "1563379091339-03b21ab4a4f8" },
  { name: "nyama-choma", id: "1555939594-58d7cb561ad1" },
  { name: "samaki-wa-kupaka", id: "1543353071-873f17a7a088" },
  { name: "biryani", id: "1563379091339-03b21ab4a4f8" },
  { name: "wali-wa-nazi", id: "1631515243349-e0cb75fb8d3a" },
  { name: "sambusa", id: "1601050690597-df0568f70950" },
  { name: "bhajia", id: "1585937421612-70a008356fbe" },
  { name: "octopus", id: "1604908176997-125f25cc6f3d" },
  { name: "mishkaki-prawns", id: "1559339352-11d035aa65de" },
  { name: "mishkaki-kuku", id: "1631452180519-c014fe946bc7" },
  { name: "samaki-wa-kuchoma", id: "1543353071-873f17a7a088" },
  { name: "kachumbari", id: "1512058564366-18510be2db19" },
  { name: "ugali", id: "1504674900247-0877df9cc836" },
  { name: "chapati", id: "1504674900247-0877df9cc836" },
  { name: "mandazi", id: "1533910534207-90f31029a78e" },
  { name: "vitumbua", id: "1587314168485-3236d6710814" },
  { name: "ukwaju", id: "1519708227418-c8fd9a32b7a2" },
  { name: "chai", id: "1541167760496-1628856ab772" },
  { name: "madafu", id: "1600271886742-f049cd451bba" },
  { name: "mkate-wa-mayai", id: "1600891964092-4316c288032e" },
  { name: "spices", id: "1509358271058-acd22cc93898" },
  { name: "seafood", id: "1604908176997-125f25cc6f3d" },
  { name: "kaimati", id: "1533910534207-90f31029a78e" },
  { name: "shawarma", id: "1529006557810-274b9b2fc783" },
  { name: "mahamri", id: "1587314168485-3236d6710814" },
  { name: "zurbian", id: "1563379091339-03b21ab4a4f8" },
];

// Additional fallback images for placeholders
const FALLBACKS = {
  "placeholder": "1504674900247-0877df9cc836",
  "food-default": "1504674900247-0877df9cc836",
};

async function downloadImage(name, photoId) {
  const outPath = path.join(OUT_DIR, `${name}.webp`);
  if (existsSync(outPath)) {
    console.log(`  skip (exists): ${name}.webp`);
    return true;
  }

  const url = `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=800&q=80&fm=webp`;
  try {
    const res = await fetch(url, {
      headers: { "Accept": "image/webp,image/png,image/*" },
      redirect: "follow",
    });
    if (!res.ok) {
      console.warn(`  FAIL ${res.status}: ${name} (${photoId})`);
      return false;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(outPath, buf);
    console.log(`  OK ${name}.webp (${(buf.length / 1024).toFixed(0)} KB)`);
    return true;
  } catch (e) {
    console.warn(`  ERROR: ${name} — ${e.message}`);
    return false;
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Downloading ${DISHES.length} dish images to ${OUT_DIR}\n`);

  let ok = 0, fail = 0;
  for (const dish of DISHES) {
    const success = await downloadImage(dish.name, dish.id);
    if (success) ok++; else fail++;
  }

  // Download placeholder
  if (!existsSync(path.join(OUT_DIR, "placeholder.webp"))) {
    await downloadImage("placeholder", FALLBACKS["placeholder"]);
  }

  console.log(`\nDone: ${ok} ok, ${fail} failed`);
}

main().catch(console.error);
