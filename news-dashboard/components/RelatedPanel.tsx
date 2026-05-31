"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ExternalLink, Loader2 } from "lucide-react";

interface Article {
  _id: string;
  title: string;
  url: string;
  source: string;
  category: string;
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

interface Props {
  articleId: string | null;
  articleTitle: string;
  onClose: () => void;
}

export function RelatedPanel({ articleId, articleTitle, onClose }: Props) {
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!articleId) return;
    setRelated([]);
    setLoading(true);
    fetch(`/api/recommend?id=${articleId}&limit=6`)
      .then(r => r.json())
      .then(data => setRelated(Array.isArray(data) ? data : []))
      .catch(() => setRelated([]))
      .finally(() => setLoading(false));
  }, [articleId]);

  return (
    <AnimatePresence>
      {articleId && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.25 }}
          className="w-72 shrink-0 rounded-xl border border-white/8 bg-[rgb(20,20,24)] overflow-hidden flex flex-col max-h-[600px]"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles size={13} className="text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-amber-400 font-medium tracking-wide uppercase">Related</p>
                <p className="text-xs text-white/40 line-clamp-2 leading-snug mt-0.5">{articleTitle}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/25 hover:text-white/60 shrink-0 mt-0.5">
              <X size={14} />
            </button>
          </div>

          {/* Results */}
          <div className="overflow-y-auto flex-1 p-3 space-y-2">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={18} className="text-white/20 animate-spin" />
              </div>
            )}

            {!loading && related.length === 0 && (
              <div className="py-8 text-center text-xs text-white/20">
                No related articles found.<br />
                <span className="text-white/15">Run embeddings.py first.</span>
              </div>
            )}

            {related.map((r, i) => (
              <motion.div
                key={r._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-lg border border-white/5 bg-white/2 p-3 hover:bg-white/4 transition-colors group"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className={`text-[10px] font-semibold uppercase tracking-wide ${categoryColors[r.category] || "text-white/30"}`}>
                    {r.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-amber-400/50">
                      {Math.round(r.score * 100)}%
                    </span>
                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                      className="text-white/15 hover:text-white/50 transition-colors">
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
                <p className="text-xs text-white/65 group-hover:text-white/80 transition-colors leading-snug line-clamp-3">
                  {r.title}
                </p>
                <p className="text-[10px] text-white/25 mt-1.5">{r.source}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
