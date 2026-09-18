import OpenAI from "openai";
import { searchDishImage, findDishInMenu, isRecipeRequest, isVisualQuery, extractDishName } from "./images";

let client: OpenAI | null = null;

export function isAiConfigured(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

function getClient(): OpenAI {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("The AI assistant is not configured yet.");
  }
  if (!client) {
    client = new OpenAI({
      baseURL: "https://api.deepseek.com",
      apiKey,
    });
  }
  return client;
}

export const AI_MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

export const ASSISTANT_NAME = process.env.AI_ASSISTANT_NAME ?? "Sweya";

export const SYSTEM_PROMPT = `You are ${ASSISTANT_NAME}, a friendly AI food assistant for Swahili Dishes, a Kenyan restaurant serving authentic Swahili coastal dishes.

Your job:
- Help customers decide what to order (pilau, biryani, chapati, samaki-nyama choma, mahamri, kaimati, vitumbua, viazi karai, and more).
- Suggest dishes for an occasion, mood, or taste preference (spicy, light, vegetarian).
- Explain what a dish is, its ingredients, and how it is prepared.
- Answer questions about delivery, pickup, allergies, and placing orders.
- Keep answers short, warm, and helpful. Use a little Swahili when it feels natural, e.g. "karibu", "asante", "ladha njema".
- You do NOT know live prices, stock levels, or today's promotions — if asked, direct the customer to browse the menu on the site.
- Never claim to take payments or orders directly; tell the customer to add dishes to the cart and check out on the site.
- When showing a dish image, mention you're sharing a photo of the dish.

When a user asks for a recipe, give them a proper Swahili recipe with:
1. A short intro about the dish
2. Ingredients list with quantities
3. Step-by-step instructions
4. A serving tip

When a user asks to see a dish or what it looks like, acknowledge the image you're sharing.

Keep recipes concise but authentic to coastal Kenyan cuisine.`;

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatResponse = {
  text: string;
  imageUrl?: string | null;
  dishName?: string | null;
};

export async function getAssistantReply(history: ChatMessage[]): Promise<ChatResponse> {
  const api = getClient();

  const lastUserMsg = history.filter((m) => m.role === "user").slice(-1)[0];
  if (!lastUserMsg) {
    return { text: "Asante! How can I help you today?", imageUrl: null, dishName: null };
  }

  const msg = lastUserMsg.content;
  const isRecipe = isRecipeRequest(msg);
  const isVisual = isVisualQuery(msg);
  const dishName = extractDishName(msg);

  // Decide whether to fetch an image
  const shouldFetchImage = (isRecipe && dishName) || (isVisual && dishName);

  // Fetch dish image in parallel with AI reply
  const imagePromise = shouldFetchImage
    ? (async () => {
        // First try local menu DB
        const menuMatch = dishName ? await findDishInMenu(dishName) : null;
        if (menuMatch?.imageUrl) return { imageUrl: menuMatch.imageUrl, dishName: menuMatch.name };

        // Fallback to Firecrawl
        const url = dishName ? await searchDishImage(dishName) : null;
        return { imageUrl: url, dishName };
      })()
    : Promise.resolve({ imageUrl: null as string | null, dishName: null as string | null });

  const [imageResult, completion] = await Promise.all([
    imagePromise,
    api.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
      temperature: 0.7,
      max_tokens: 800,
    }),
  ]);

  const text = completion.choices[0]?.message?.content?.trim() ?? "Asante! Please try again.";

  return {
    text,
    imageUrl: imageResult.imageUrl,
    dishName: imageResult.dishName,
  };
}
