"use client";
import { motion } from "framer-motion";
import { RefreshCw, Wifi } from "lucide-react";
import { useState, useEffect } from "react";

interface HeaderProps {
  onRefresh: () => void;
  loading: boolean;
}

export function Header({ onRefresh, loading }: HeaderProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-between mb-10 pt-2"
    >
      <div>
        <p className="text-xs text-white/25 tracking-widest uppercase">News Intelligence Dashboard</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2">
          <Wifi size={12} className="text-emerald-400" />
          <span className="font-mono text-sm text-white/40">{time}</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white/60 hover:text-white hover:border-white/20 hover:bg-white/8 transition-all duration-200 disabled:opacity-50"
        >
          <motion.span animate={loading ? { rotate: 360 } : {}} transition={{ duration: 0.8, repeat: loading ? Infinity : 0, ease: "linear" }}>
            <RefreshCw size={14} />
          </motion.span>
          <span className="hidden sm:inline">Refresh</span>
        </motion.button>
      </div>
    </motion.header>
  );
}
