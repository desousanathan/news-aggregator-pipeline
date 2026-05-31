"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, ExternalLink, Bot, User, Loader2, Sparkles } from "lucide-react";

interface Source {
  title: string;
  url: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  error?: boolean;
}

const SUGGESTED = [
  "What's happening in tech today?",
  "Any major political developments?",
  "Latest business news?",
  "Top science stories?",
];

export function NewsChat() {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef<HTMLDivElement>(null);
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setInput("");

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: question };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res  = await fetch(`/api/chat?q=${encodeURIComponent(question)}&limit=5`);
      const data = await res.json();

      if (!res.ok || data.error) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: "assistant",
          content: data.error || "Something went wrong. Make sure the FastAPI server is running with the `/chat` endpoint added.",
          error: true,
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: "assistant",
          content: data.answer,
          sources: data.sources,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "Could not reach the API. Is FastAPI running on port 8000?",
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); }
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(v => !v)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full border shadow-lg transition-all duration-200 ${
          open
            ? "bg-amber-400/20 border-amber-400/40 text-amber-400"
            : "bg-[rgb(22,22,26)] border-white/10 text-white/50 hover:text-white hover:border-white/20"
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={16} />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageSquare size={16} />
            </motion.span>
          )}
        </AnimatePresence>
        <span className="text-sm font-medium">Ask the news</span>
        {!open && (
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed bottom-20 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl border border-white/8 bg-[rgb(18,18,22)] shadow-2xl shadow-black/60 overflow-hidden"
            style={{ height: "520px" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/6 bg-[rgb(20,20,24)]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-400/15 border border-amber-400/25 flex items-center justify-center">
                  <Sparkles size={13} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">News Assistant</p>
                  <p className="text-[10px] text-white/25 leading-none">RAG · powered by your articles</p>
                </div>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="ml-auto text-[10px] text-white/20 hover:text-white/45 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: "none" }}>
              {messages.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full gap-4 pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/8 border border-amber-400/15 flex items-center justify-center">
                    <Bot size={22} className="text-amber-400/50" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-white/50 mb-1">Ask anything about today's news</p>
                    <p className="text-[11px] text-white/20">Answers are grounded in your scraped articles</p>
                  </div>
                  <div className="flex flex-col gap-2 w-full mt-2">
                    {SUGGESTED.map(s => (
                      <button key={s} onClick={() => ask(s)}
                        className="text-left text-xs text-white/35 hover:text-white/65 px-3 py-2 rounded-lg border border-white/5 hover:border-white/12 hover:bg-white/3 transition-all duration-150">
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <AnimatePresence initial={false}>
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${
                      msg.role === "user"
                        ? "bg-white/8 border border-white/10"
                        : "bg-amber-400/12 border border-amber-400/20"
                    }`}>
                      {msg.role === "user"
                        ? <User size={11} className="text-white/40" />
                        : <Bot size={11} className="text-amber-400/70" />
                      }
                    </div>

                    <div className={`flex flex-col gap-1.5 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      <div className={`px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-white/8 border border-white/10 text-white/75"
                          : msg.error
                            ? "bg-red-500/8 border border-red-500/15 text-red-400/80"
                            : "bg-[rgb(24,24,28)] border border-white/6 text-white/70"
                      }`}>
                        {msg.content}
                      </div>

                      {msg.sources && msg.sources.length > 0 && (
                        <div className="flex flex-col gap-1 w-full">
                          <p className="text-[10px] text-white/20 px-1">Sources</p>
                          {msg.sources.map((src, i) => (
                            <a key={i} href={src.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/5 hover:border-amber-400/20 hover:bg-amber-400/4 transition-all duration-150 group">
                              <ExternalLink size={9} className="text-white/20 group-hover:text-amber-400/50 mt-0.5 shrink-0" />
                              <span className="text-[11px] text-white/30 group-hover:text-white/55 transition-colors leading-snug line-clamp-2">
                                {src.title}
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full shrink-0 bg-amber-400/12 border border-amber-400/20 flex items-center justify-center mt-0.5">
                    <Bot size={11} className="text-amber-400/70" />
                  </div>
                  <div className="px-3.5 py-2.5 rounded-xl bg-[rgb(24,24,28)] border border-white/6">
                    <Loader2 size={13} className="text-amber-400/50 animate-spin" />
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-white/6 bg-[rgb(20,20,24)]">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgb(14,14,18)] border border-white/8 focus-within:border-amber-400/25 transition-colors">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask about today's news…"
                  className="flex-1 bg-transparent text-[13px] text-white/70 placeholder:text-white/20 outline-none"
                />
                <button
                  onClick={() => ask(input)}
                  disabled={!input.trim() || loading}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed bg-amber-400/15 hover:bg-amber-400/25 text-amber-400 border border-amber-400/20"
                >
                  <Send size={12} />
                </button>
              </div>
              <p className="text-[10px] text-white/15 text-center mt-2">
                Answers sourced from your scraped articles
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
