"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ExternalLink, Loader2 } from "lucide-react";

interface SearchResult {
  _id: string;
  title: string;
  url: string;
  description: string;
  source: string;
  category: string;
  date: string;
  score: number;
}

const categoryColors: Record<string, string> = {
  Technology:     "text-blue-400",
  Politics:       "text-purple-400",
  Business:       "text-amber-400",
  "General News": "text-emerald-400",
  Science:        "text-cyan-400",
  Health:         "text-rose-400",
};

export function SemanticSearch() {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`);
        const data = await res.json();
        if (data.error) { setError(data.error); setResults([]); }
        else setResults(Array.isArray(data) ? data : []);
      } catch {
        setError("Search failed");
      } finally {
        setLoading(false);
      }
    }, 500);
  }, [query]);

  return (
    <>
      {/* Trigger button */}
      <motion.button
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-400/20 bg-amber-400/8 text-amber-400 text-sm font-medium hover:bg-amber-400/15 transition-all duration-200"
      >
        <Sparkles size={14} />
        AI Search
      </motion.button>

      {/* Modal overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[rgb(18,18,22)] shadow-2xl overflow-hidden"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
                <Sparkles size={16} className="text-amber-400 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search by meaning — e.g. 'climate policy changes' or 'tech layoffs'"
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 focus:outline-none"
                />
                {loading
                  ? <Loader2 size={15} className="text-white/30 animate-spin shrink-0" />
                  : query && <button onClick={() => setQuery("")} className="text-white/30 hover:text-white/60"><X size={15} /></button>
                }
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {error && (
                  <div className="px-5 py-4 text-sm text-red-400/70">{error}</div>
                )}

                {!error && results.length === 0 && query && !loading && (
                  <div className="px-5 py-8 text-center text-sm text-white/25">No results found</div>
                )}

                {!error && results.length === 0 && !query && (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm text-white/25 mb-2">Semantic search powered by embeddings</p>
                    <p className="text-xs text-white/15">Finds articles by meaning, not just keywords</p>
                  </div>
                )}

                {results.map((r, i) => (
                  <motion.div
                    key={r._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-4 px-5 py-4 border-b border-white/5 hover:bg-white/3 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-semibold uppercase tracking-wide ${categoryColors[r.category] || "text-white/40"}`}>
                          {r.category}
                        </span>
                        <span className="text-[10px] text-white/20">{r.source}</span>
                      </div>
                      <p className="text-sm text-white/80 group-hover:text-white transition-colors leading-snug line-clamp-2">
                        {r.title}
                      </p>
                      {r.description && (
                        <p className="text-xs text-white/30 mt-1 line-clamp-1">{r.description}</p>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <span className="text-[10px] font-mono text-amber-400/60 bg-amber-400/8 px-1.5 py-0.5 rounded">
                        {Math.round(r.score * 100)}%
                      </span>
                      <a href={r.url} target="_blank" rel="noopener noreferrer"
                        className="text-white/20 hover:text-white/60 transition-colors">
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>

              {results.length > 0 && (
                <div className="px-5 py-3 text-xs text-white/20 text-center">
                  {results.length} results — sorted by semantic similarity
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
