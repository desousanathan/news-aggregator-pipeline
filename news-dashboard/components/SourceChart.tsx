"use client";
import { motion } from "framer-motion";

interface Props {
  sources: Record<string, number>;
  onSourceClick?: (source: string) => void;
  activeSource?: string;
}

const colors = ["#fbbf24", "#60a5fa", "#34d399", "#c084fc", "#f87171", "#22d3ee", "#fb923c", "#a3e635"];

export function SourceChart({ sources, onSourceClick, activeSource }: Props) {
  const sorted = Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max    = sorted[0]?.[1] || 1;

  return (
    <div className="rounded-xl border border-white/5 bg-[rgb(20,20,24)] p-5">
      <h3 className="text-xs font-medium tracking-widest uppercase text-white/30 mb-4">Top Sources</h3>
      <div className="space-y-3">
        {sorted.map(([source, count], i) => {
          const active = activeSource === source;
          return (
            <motion.button
              key={source}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.07 }}
              onClick={() => onSourceClick?.(source)}
              className={`w-full text-left transition-opacity ${active ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium transition-colors ${active ? "text-amber-400" : "text-white/60"}`}>{source}</span>
                <span className="text-xs text-white/25">{count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(count / max) * 100}%` }}
                  transition={{ delay: 0.4 + i * 0.07, duration: 0.7, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: active ? "#fbbf24" : colors[i % colors.length] }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
