"use server";

import { getAssistantReply } from "lib/ai";
import type { ChatMessage, ChatResponse } from "lib/ai";

export async function askAssistant(history: ChatMessage[]): Promise<ChatResponse> {
  try {
    return await getAssistantReply(history);
  } catch (e) {
    console.error("askAssistant error:", e);
    return {
      text:
        "Jambo! The assistant is not configured on this store yet. " +
        "Once it is set up, I can help you pick the perfect dish.",
      imageUrl: null,
      dishName: null,
    };
  }
}
