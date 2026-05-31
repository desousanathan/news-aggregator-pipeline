"use client";
import { motion } from "framer-motion";
import { ExternalLink, Clock, Radio, Sparkles } from "lucide-react";

export interface NewsItem {
  _id: string;
  title: string;
  url: string;
  description: string;
  date: string;
  category: string;
  source: string;
  scraped_at: string;
}

const categoryConfig: Record<string, { color: string; bg: string; dot: string }> = {
  Technology:     { color: "text-blue-400",    bg: "bg-blue-400/10 border-blue-400/20",    dot: "bg-blue-400" },
  Politics:       { color: "text-purple-400",  bg: "bg-purple-400/10 border-purple-400/20", dot: "bg-purple-400" },
  Business:       { color: "text-amber-400",   bg: "bg-amber-400/10 border-amber-400/20",  dot: "bg-amber-400" },
  "General News": { color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", dot: "bg-emerald-400" },
  Science:        { color: "text-cyan-400",    bg: "bg-cyan-400/10 border-cyan-400/20",    dot: "bg-cyan-400" },
  Health:         { color: "text-rose-400",    bg: "bg-rose-400/10 border-rose-400/20",    dot: "bg-rose-400" },
  Sports:         { color: "text-orange-400",  bg: "bg-orange-400/10 border-orange-400/20", dot: "bg-orange-400" },
  Entertainment:  { color: "text-pink-400",    bg: "bg-pink-400/10 border-pink-400/20",    dot: "bg-pink-400" },
};
const defaultConfig = { color: "text-slate-400", bg: "bg-slate-400/10 border-slate-400/20", dot: "bg-slate-400" };

function isRecent(date: string | null | undefined): boolean {
  if (!date) return false;
  return date.includes("min") || date.includes("hour");
}

interface CardProps {
  item: NewsItem;
  index: number;
  onSourceClick?: (source: string) => void;
  onRecommend?: (id: string, title: string) => void;
  activeRecommend?: string | null;
}

export function NewsCard({ item, index, onSourceClick, onRecommend, activeRecommend }: CardProps) {
  const cfg    = categoryConfig[item.category] || defaultConfig;
  const recent = isRecent(item.date);
  const isActive = activeRecommend === item._id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group relative"
    >
      <div className={`relative overflow-hidden rounded-xl border bg-[rgb(20,20,24)] p-5 transition-all duration-300 hover:bg-[rgb(24,24,28)] hover:shadow-lg hover:shadow-black/30 h-full flex flex-col ${
        isActive ? "border-amber-400/30 shadow-amber-400/5 shadow-lg" : "border-white/5 hover:border-white/10"
      }`}>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${recent ? "live-dot" : ""}`} />
              {item.category}
            </span>
            {recent && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-400/80 font-medium">
                <Radio size={10} className="live-dot" /> LIVE
              </span>
            )}
          </div>
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            className="text-white/20 hover:text-white/60 transition-colors shrink-0 mt-0.5">
            <ExternalLink size={14} />
          </a>
        </div>

        {/* Title */}
        <h3 className="text-[15px] leading-snug text-white/90 mb-2 group-hover:text-white transition-colors flex-1">
          {item.title}
        </h3>

        {/* Description */}
        <p className="text-[13px] leading-relaxed text-white/40 mb-4 line-clamp-2">{item.description}</p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
          <button
            onClick={() => onSourceClick?.(item.source)}
            className="flex items-center gap-1.5 group/src"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover/src:bg-amber-400 transition-colors" />
            <span className="text-xs font-semibold text-white/40 group-hover/src:text-amber-400 transition-colors tracking-wide uppercase">
              {item.source}
            </span>
          </button>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-white/25">
              <Clock size={10} />{item.date}
            </span>
            {onRecommend && (
              <button
                onClick={() => onRecommend(item._id, item.title)}
                title="Find related articles"
                className={`transition-colors ${isActive ? "text-amber-400" : "text-white/15 hover:text-amber-400/60"}`}
              >
                <Sparkles size={13} />
              </button>
            )}
          </div>
        </div>

        {isActive && (
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
        )}
      </div>
    </motion.div>
  );
}

export function NewsRow({ item, index, onSourceClick, onRecommend, activeRecommend }: CardProps) {
  const cfg    = categoryConfig[item.category] || defaultConfig;
  const recent = isRecent(item.date);
  const isActive = activeRecommend === item._id;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="group"
    >
      <div className={`flex items-center gap-4 rounded-xl border px-5 py-3.5 bg-[rgb(20,20,24)] hover:bg-[rgb(24,24,28)] transition-all duration-200 ${
        isActive ? "border-amber-400/20" : "border-white/5 hover:border-white/10"
      }`}>
        <div className={`w-1 h-10 rounded-full shrink-0 ${cfg.dot} opacity-50`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-semibold tracking-wide uppercase ${cfg.color}`}>{item.category}</span>
            {recent && <span className="text-[10px] text-amber-400/70 font-medium">● LIVE</span>}
          </div>
          <h3 className="text-sm font-medium text-white/80 group-hover:text-white transition-colors leading-snug line-clamp-1">{item.title}</h3>
          <p className="text-xs text-white/30 mt-0.5 line-clamp-1">{item.description}</p>
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <button onClick={() => onSourceClick?.(item.source)} className="group/src hidden sm:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white/15 group-hover/src:bg-amber-400 transition-colors" />
            <span className="text-xs font-semibold text-white/30 group-hover/src:text-amber-400 transition-colors tracking-wide uppercase">{item.source}</span>
          </button>
          <span className="text-[11px] text-white/20 hidden md:block">{item.date}</span>
          {onRecommend && (
            <button onClick={() => onRecommend(item._id, item.title)}
              className={`transition-colors ${isActive ? "text-amber-400" : "text-white/15 hover:text-amber-400/60"}`}>
              <Sparkles size={12} />
            </button>
          )}
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-white/15 hover:text-white/50 transition-colors">
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

export function NewsCardSkeleton({ index }: { index: number }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }}
      className="rounded-xl border border-white/5 bg-[rgb(20,20,24)] p-5">
      <div className="flex items-center gap-2 mb-3"><div className="h-5 w-20 rounded-full skeleton-shimmer" /></div>
      <div className="h-4 w-full rounded skeleton-shimmer mb-2" />
      <div className="h-4 w-4/5 rounded skeleton-shimmer mb-4" />
      <div className="h-3 w-full rounded skeleton-shimmer mb-1" />
      <div className="h-3 w-3/5 rounded skeleton-shimmer mb-4" />
      <div className="flex justify-between pt-3 border-t border-white/5">
        <div className="h-3 w-16 rounded skeleton-shimmer" />
        <div className="h-3 w-12 rounded skeleton-shimmer" />
      </div>
    </motion.div>
  );
}
