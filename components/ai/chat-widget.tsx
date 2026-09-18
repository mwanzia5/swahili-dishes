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

const SUGGESTIONS = [
  "What's the recipe for mahamri?",
  "How do you make pilau?",
  "Do you have vegetarian options?",
  "Show me what pilau looks like",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;

    const userMsg: UiMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setIsThinking(true);

    try {
      const response = await askAssistant(
        next.map(({ role, content }) => ({ role, content }))
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
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content:
            "Jambo! I am still learning and not configured on this store yet.",
          imageUrl: null,
        },
      ]);
    } finally {
      setIsThinking(false);
      // Scroll to bottom
      setTimeout(() => {
        panelRef.current?.scrollTo({
          top: panelRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
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
        // User clicked mic but didn't speak — no alert needed
      } else if (event.error === "network") {
        alert("Voice recognition network error. Please try again.");
      }
    };
    setIsListening(true);
    sr.start();
  };

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-[90px] right-5 z-[999] flex w-[380px] max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-gold-400)] text-xs font-bold text-[var(--color-ink)]">
                SD
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Swahili Dishes
                </h3>
                <p className="text-[0.7rem] text-neutral-500">
                  Ask about our menu
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div
            ref={panelRef}
            className="flex-1 space-y-3 overflow-y-auto px-5 py-4"
            style={{ maxHeight: 420 }}
          >
            {messages.length === 0 && (
              <div className="text-sm text-neutral-500">
                <p className="mb-3 font-medium text-neutral-400">
                  Try asking:
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((q) => (
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
                {/* Image for recipe responses */}
                {m.imageUrl && (
                  <div className="mb-2 overflow-hidden rounded-xl border border-neutral-800">
                    <img
                      src={m.imageUrl}
                      alt={m.dishName ?? "Dish"}
                      className="h-40 w-full object-cover"
                      onError={(e) => {
                        // Hide broken images
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    {m.dishName && (
                      <div className="bg-neutral-900 px-3 py-1.5 text-[0.7rem] text-neutral-400">
                        📸 {m.dishName}
                      </div>
                    )}
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={
                    m.role === "user"
                      ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[var(--color-gold-400)] px-4 py-3 text-sm text-white"
                      : "max-w-[85%] rounded-2xl rounded-bl-sm border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-200 whitespace-pre-line"
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex items-center gap-2 max-w-[85%] rounded-2xl rounded-bl-sm border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-500">
                <span className="animate-pulse">●</span>
                <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>●</span>
                <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>●</span>
                <span className="ml-1">Thinking…</span>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            className="flex items-center gap-2 border-t border-neutral-800 px-4 py-3"
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
                  ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold-400)] text-white"
                  : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-800 text-neutral-400 transition hover:border-[var(--color-gold-400)] hover:text-white"
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4"
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
              placeholder="Ask about the menu…"
              className="h-9 flex-1 rounded-full border border-neutral-800 bg-neutral-900 px-4 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-[var(--color-gold-400)]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isThinking}
              className="h-9 shrink-0 rounded-full bg-[var(--color-gold-400)] px-4 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              Ask
            </button>
          </form>
        </div>
      )}

      {/* Toggle bubble */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat assistant" : "Open chat assistant"}
        className="fixed bottom-5 right-5 z-[999] flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-gold-400)] text-[var(--color-ink)] shadow-lg transition-transform hover:scale-110"
        style={{
          boxShadow: "0 8px 30px -4px rgba(226,161,58,0.45)",
        }}
      >
        {open ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 20.105V4.875A1.875 1.875 0 0 1 5.625 3h12.75A1.875 1.875 0 0 1 20.25 4.875v8.25a1.875 1.875 0 0 1-1.875 1.875h-2.1l-3.09 3.09a.75.75 0 0 1-1.26-.53v-2.06H5.625A1.875 1.875 0 0 1 3.75 12.93V20.105Z"
            />
          </svg>
        )}
      </button>
    </>
  );
}
