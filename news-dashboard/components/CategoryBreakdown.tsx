"use client";
import { motion } from "framer-motion";

interface Props {
  categories: Record<string, number>;
  activeCategory: string;
  onSelect: (cat: string) => void;
}

const catColors: Record<string, string> = {
  Technology: "#60a5fa",
  Politics: "#c084fc",
  Business: "#fbbf24",
  "General News": "#34d399",
  Science: "#22d3ee",
  Health: "#f87171",
  All: "#e8be64",
};

export function CategoryBreakdown({ categories, activeCategory, onSelect }: Props) {
  const all = [["All", Object.values(categories).reduce((a, b) => a + b, 0)] as [string, number], ...Object.entries(categories).sort((a, b) => b[1] - a[1])];
  const max = Math.max(...all.slice(1).map(([, v]) => v as number));

  return (
    <div className="rounded-xl border border-white/5 bg-[rgb(20,20,24)] p-5">
      <h3 className="text-xs font-medium tracking-widest uppercase text-white/30 mb-4">By Category</h3>
      <div className="space-y-2">
        {all.map(([cat, count], i) => {
          if (cat === "All") return null;
          const pct = ((count as number) / max) * 100;
          const color = catColors[cat] || "#888";
          const active = activeCategory === cat;
          return (
            <motion.button
              key={cat}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => onSelect(active ? "All" : cat)}
              className={`w-full text-left group transition-all duration-200 rounded-lg p-2 -mx-2 ${active ? "bg-white/5" : "hover:bg-white/3"}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium transition-colors ${active ? "text-white" : "text-white/50 group-hover:text-white/70"}`}>
                  {cat}
                </span>
                <span className="text-xs text-white/25">{count as number}</span>
              </div>
              <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.3 + i * 0.06, duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: color, opacity: active ? 1 : 0.5 }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
