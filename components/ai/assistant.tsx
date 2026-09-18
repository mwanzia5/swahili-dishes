"use client";

import { useRef, useState } from "react";
import { askAssistant } from "app/ai/actions";
import type { ChatMessage } from "lib/ai";

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  const ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return ctor ? new ctor() : null;
}

type UiMessage = ChatMessage & {
  id: string;
  imageUrl?: string | null;
  dishName?: string | null;
};

export function Assistant() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;

    const userMsg: UiMessage = { id: `u-${Date.now()}`, role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setIsThinking(true);

    try {
      const response = await askAssistant(
        next.map(({ role, content }) => ({ role, content })),
      );
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: response.text,
          imageUrl: response.imageUrl,
          dishName: response.dishName,
        },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content:
            "Jambo! I am still learning and not configured on this store yet. Ask me again once the assistant is set up.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const sr = getSpeechRecognition();
    if (!sr) {
      alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    recognitionRef.current = sr;
    sr.lang = "en-US";
    sr.interimResults = false;
    sr.continuous = false;
    sr.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) {
        setInput(transcript);
        send(transcript);
      }
    };
    sr.onend = () => setIsListening(false);
    sr.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        alert("Microphone access was denied. Please allow microphone access in your browser settings.");
      } else if (event.error === "no-speech") {
        // User clicked mic but didn't speak
      } else if (event.error === "network") {
        alert("Voice recognition network error. Please try again.");
      }
    };
    setIsListening(true);
    sr.start();
  };

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-white">
          Swahili Dishes Assistant
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Ask about our menu, dish ingredients, or what suits your taste.
        </p>
      </div>

      <div className="flex-1 space-y-4">
        {messages.length === 0 && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 text-sm text-neutral-500">
            <p className="mb-3 font-medium text-neutral-400">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {[
                "I love spicy food, what should I order?",
                "What is in your pilau?",
                "Do you have vegetarian options?",
                "What's good for a birthday party?",
                "Show me what mahamri looks like",
                "How does pilau look?",
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="rounded-full border border-neutral-800 px-3 py-1.5 text-xs transition hover:border-[var(--color-gold-400)] hover:text-white"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id}>
            {/* Image for recipe/visual responses */}
            {m.imageUrl && (
              <div className="mb-2 overflow-hidden rounded-xl border border-neutral-800">
                <img
                  src={m.imageUrl}
                  alt={m.dishName ?? "Dish"}
                  className="h-48 w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                {m.dishName && (
                  <div className="bg-neutral-950 px-3 py-1.5 text-[0.7rem] text-neutral-400">
                    {m.dishName}
                  </div>
                )}
              </div>
            )}

            {/* Message bubble */}
            <div
              className={
                m.role === "user"
                  ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--color-gold-400)] px-4 py-3 text-sm text-white"
                  : "max-w-[85%] rounded-2xl rounded-bl-sm border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200 whitespace-pre-line"
              }
            >
              {m.content}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-500">
            Thinking…
          </div>
        )}
      </div>

      <form
        className="mt-6 flex items-center gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <button
          type="button"
          onClick={toggleListening}
          aria-label={isListening ? "Stop voice input" : "Use voice input"}
          title="Voice input"
          className={
            isListening
              ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold-400)] text-white"
              : "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-neutral-800 text-neutral-400 transition hover:border-[var(--color-gold-400)] hover:text-white"
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
            />
          </svg>
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the menu… (e.g. nauli ya pilau)"
          className="h-12 flex-1 rounded-full border border-neutral-800 bg-neutral-900 px-5 text-sm text-white placeholder-cream-300/50 outline-none transition focus:border-[var(--color-gold-400)]"
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          className="h-12 shrink-0 rounded-full bg-[var(--color-gold-400)] px-6 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
        >
          Ask
        </button>
      </form>
    </div>
  );
}