import { ChatWidget } from "components/ai/chat-widget";

export const metadata = {
  title: "AI Assistant",
  description: "Ask Swahili Dishes AI assistant about our menu, dishes and more.",
};

export default function AiPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-gold-400)] text-3xl font-bold text-[var(--color-ink)]">
        SD
      </div>
      <h1
        className="mb-3 text-[clamp(2rem,3.5vw,3rem)] font-medium text-cream-050"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Swahili Dishes Assistant
      </h1>
      <p className="mb-8 max-w-md text-cream-300">
        Ask about our menu, dish ingredients, or what suits your taste. Use the
        chat button in the corner to start a conversation.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <a href="/menu" className="btn btn-primary">
          Browse the menu
        </a>
        <a href="/recipes" className="btn btn-outline">
          Explore recipes
        </a>
      </div>
      <ChatWidget />
    </div>
  );
}
