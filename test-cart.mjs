import { createAdminClient } from "@insforge/sdk";
import * as fs from "fs";
import { randomUUID } from "crypto";

const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.trim().match(/^([A-Za-z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

const admin = createAdminClient({ baseUrl: env.INSFORGE_URL, apiKey: env.INSFORGE_API_KEY });
console.log("Testing cart insert...");
const sessionToken = randomUUID();
const { data, error } = await admin.database.from("carts").insert([{
  session_token: sessionToken,
  status: "ACTIVE",
}]).select("id").single();
console.log("insert cart:", error || data);

if (data) {
  const cartId = data.id;
  const { data: itemData, error: itemError } = await admin.database.from("cart_items").insert([{
    cart_id: cartId,
    product_id: "test-product",
    variant_id: null,
    quantity: 1,
    unit_price: "100.00",
    extras: [],
    notes: null,
  }]).select("*");
  console.log("insert item:", itemError || itemData);
  
  const { data: cartData, error: cartError } = await admin.database.from("carts").select("*, items:cart_items(*)").eq("id", cartId).single();
  console.log("read back cart:", cartError || cartData);
}