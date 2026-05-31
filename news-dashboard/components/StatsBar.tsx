"use client";
import { motion } from "framer-motion";
import { TrendingUp, Rss, Layers, Zap } from "lucide-react";

interface StatsBarProps {
  total: number;
  categories: Record<string, number>;
  sources: number;
}

export function StatsBar({ total, categories, sources }: StatsBarProps) {
  const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];

  const stats = [
    { icon: Rss, label: "Total Stories", value: total, color: "text-amber-400" },
    { icon: Layers, label: "Categories", value: Object.keys(categories).length, color: "text-blue-400" },
    { icon: TrendingUp, label: "Top Category", value: topCategory?.[0] || "—", color: "text-emerald-400" },
    { icon: Zap, label: "Sources Active", value: sources, color: "text-purple-400" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
          className="rounded-xl border border-white/5 bg-[rgb(20,20,24)] p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <stat.icon size={14} className={stat.color} />
            <span className="text-xs text-white/30 font-medium tracking-wide uppercase">{stat.label}</span>
          </div>
          <div className={`font-display text-2xl ${stat.color}`}>
            {typeof stat.value === "number" ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.08 }}
              >
                {stat.value}
              </motion.span>
            ) : (
              <span className="text-lg">{stat.value}</span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
