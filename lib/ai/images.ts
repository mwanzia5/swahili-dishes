import Firecrawl from "firecrawl";
import { getAdminClient } from "lib/insforge/admin";

let client: Firecrawl | null = null;

function getClient(): Firecrawl {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not set");
  if (!client) {
    client = new Firecrawl({ apiKey });
  }
  return client;
}

/**
 * Search the web for a dish image using Firecrawl.
 * Returns the first good image URL found, or null.
 */
export async function searchDishImage(dishName: string): Promise<string | null> {
  try {
    const fc = getClient();
    const query = `${dishName} swahili kenyan dish food photo`;

    const results = await fc.search(query, {
      sources: ["images"],
      limit: 5,
    });

    // Firecrawl search returns { images: [...], web: [...], news: [...] }
    const images = results.images;
    if (images && images.length > 0) {
      for (const img of images) {
        // Narrow type: only SearchResultImages has imageUrl
        if ("imageUrl" in img && img.imageUrl) return img.imageUrl;
      }
    }

    // Fallback: search web results for images in markdown
    const webResults = await fc.search(query, {
      sources: ["web"],
      limit: 3,
    });

    if (webResults.web) {
      for (const result of webResults.web) {
        const markdown = (result as any).markdown ?? "";
        const imageMatch = markdown.match(/!\[.*?\]\((https?:\/\/[^)]+)\)/);
        if (imageMatch?.[1]) return imageMatch[1];
      }
    }

    return null;
  } catch (e) {
    console.error("searchDishImage error:", e);
    return null;
  }
}

/**
 * Search for a dish in the local menu database to get its slug and image.
 */
export async function findDishInMenu(dishName: string): Promise<{ slug: string; name: string; imageUrl?: string } | null> {
  try {
    const admin = getAdminClient();
    const { data: products } = await admin.database
      .from("products")
      .select("id, name, slug, image_url")
      .ilike("name", `%${dishName}%`)
      .eq("is_published", true)
      .limit(5);

    if (products && products.length > 0) {
      // Find best match
      const lowerDish = dishName.toLowerCase();
      let bestMatch = products[0];
      
      for (const p of products) {
        if (p.name.toLowerCase().includes(lowerDish) || lowerDish.includes(p.name.toLowerCase())) {
          bestMatch = p;
          break;
        }
      }
      
      if (bestMatch) {
        return {
          slug: bestMatch.slug,
          name: bestMatch.name,
          imageUrl: bestMatch.image_url,
        };
      }
    }
    return null;
  } catch (e) {
    console.error("findDishInMenu error:", e);
    return null;
  }
}

/**
 * Detect if a user message is asking for a recipe.
 */
export function isRecipeRequest(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("recipe") ||
    lower.includes("how to make") ||
    lower.includes("how to cook") ||
    lower.includes("how do you make") ||
    lower.includes("how do you cook") ||
    lower.includes(" ingredients") ||
    lower.includes("step by step") ||
    lower.includes("prepare") ||
    (lower.includes("what is") && (lower.includes("made of") || lower.includes("in it")))
  );
}

/**
 * Detect if a user message is asking to SEE a dish (visual query).
 */
export function isVisualQuery(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("what does") && (lower.includes("look like") || lower.includes("look")) ||
    lower.includes("show me") ||
    lower.includes("how does") && lower.includes("look") ||
    lower.includes("can i see") ||
    lower.includes("picture of") ||
    lower.includes("photo of") ||
    lower.includes("image of") ||
    lower.includes("show a picture") ||
    lower.includes("how it looks") ||
    lower.includes("what it looks like")
  );
}

/**
 * Detect if a user message is asking about a menu item (to show "View on Menu" button).
 */
export function isMenuQuery(message: string): { isQuery: boolean; dishName?: string } {
  const lower = message.toLowerCase();
  
  // Patterns for menu queries
  const patterns = [
    /do you (have|sell|serve)\s+(.+?)(?:\s*\?|$)/,
    /is\s+(.+?)\s+(?:on\s+the\s+)?menu/,
    /menu.*?(.+?)(?:\s*\?|$)/,
    /what.*?(?:dishes?|food).*?(?:have|serve|sell)/,
    /recommend.*?(.+?)(?:\s*\?|$)/,
    /what(?:'s| is|'s)\s+(.+?)(?:\s*\?|$)/,
  ];
  
  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match?.[1]) {
      return { isQuery: true, dishName: match[1].trim() };
    }
  }
  
  return { isQuery: false };
}

/**
 * Extract the dish name from a recipe request or visual query message.
 */
export function extractDishName(message: string): string | null {
  const lower = message.toLowerCase();

  // Pattern: "show me X" / "show me what X looks like"
  let match = lower.match(/show\s+me\s+(?:what\s+)?(.+?)(?:\s+look(?:s|\s+like)|\s*\?|$)/);
  if (match?.[1]) return capitalize(match[1].trim());

  // Pattern: "how does X look" / "what does X look like"
  match = lower.match(/(?:how|what)\s+(?:does|do)\s+(.+?)\s+look/);
  if (match?.[1]) return capitalize(match[1].trim());

  // Pattern: "picture/photo/image of X"
  match = lower.match(/(?:picture|photo|image)\s+of\s+(.+?)(?:\s*\?|$)/);
  if (match?.[1]) return capitalize(match[1].trim());

  // Pattern: "can I see X"
  match = lower.match(/(?:can\s+i|let\s+me)\s+see\s+(.+?)(?:\s*\?|$)/);
  if (match?.[1]) return capitalize(match[1].trim());

  // Pattern: "recipe for X" / "recipe of X"
  match = lower.match(/recipe\s+(?:for|of)\s+(?:the\s+)?(.+?)(?:\s*\?|$)/);
  if (match?.[1]) return capitalize(match[1].trim());

  // Pattern: "how to make/cook X"
  match = lower.match(/how\s+(?:to|do\s+you)\s+(?:make|cook|prepare)\s+(.+?)(?:\s*\?|$)/);
  if (match?.[1]) return capitalize(match[1].trim());

  // Pattern: "what is X made of" / "what's in X"
  match = lower.match(/what(?:'s| is|'s)\s+(?:in|made?\s+(?:of|from)|inside)\s+(?:the\s+)?(.+?)(?:\s*\?|$)/);
  if (match?.[1]) return capitalize(match[1].trim());

  // Pattern: "X recipe"
  match = lower.match(/(.+?)\s+recipe(?:\s|$)/);
  if (match?.[1]) return capitalize(match[1].trim());

  return null;
}

/**
 * Strip markdown formatting from text (bold, italic, code, etc.)
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')  // **bold**
    .replace(/\*(.+?)\*/g, '$1')     // *italic*
    .replace(/__(.+?)__/g, '$1')     // __bold__
    .replace(/_(.+?)_/g, '$1')       // _italic_
    .replace(/`(.+?)`/g, '$1')       // `code`
    .replace(/```[\s\S]*?```/g, '')  // code blocks
    .replace(/#{1,6}\s+/g, '')       // headers
    .replace(/^\s*[-*+]\s+/gm, '')   // list items
    .replace(/^\s*\d+\.\s+/gm, '')   // numbered lists
    .trim();
}

function capitalize(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
