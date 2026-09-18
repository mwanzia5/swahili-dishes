import { createAdminClient } from "@insforge/sdk";
import type InsForgeClient from "@insforge/sdk";

const url = process.env.INSFORGE_URL;
const apiKey = process.env.INSFORGE_API_KEY;

let admin: InsForgeClient | null = null;

/**
 * Server-only admin client for privileged database work (orders, payments,
 * inventory, admin CRUD). Never import this module from the client.
 */
export function getAdminClient(): InsForgeClient {
  if (!url || !apiKey) {
    throw new Error(
      "INSFORGE_URL / INSFORGE_API_KEY are not set. Configure .env.local before using the admin client.",
    );
  }
  if (!admin) {
    admin = createAdminClient({ baseUrl: url, apiKey });
  }
  return admin;
}