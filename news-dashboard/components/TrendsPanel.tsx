"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, X, BarChart2, Clock, Tag } from "lucide-react";

interface CategoryTrend {
  category: string;
  count: number;
  sources: string[];
}

interface Keyword {
  word: string;
  count: number;
}

interface VolumePoint {
  time: string;
  count: number;
}

type Tab = "keywords" | "volume" | "categories";
type Window = "6" | "24" | "48" | "168";

const WINDOW_LABELS: Record<Window, string> = {
  "6": "6h",
  "24": "24h",
  "48": "48h",
  "168": "7d",
};

const categoryColors: Record<string, string> = {
  Technology:     "#60a5fa",
  Politics:       "#c084fc",
  Business:       "#fbbf24",
  "General News": "#34d399",
  Science:        "#22d3ee",
  Health:         "#f87171",
  Sports:         "#fb923c",
  Entertainment:  "#f472b6",
};

function getColor(cat: string, i: number) {
  const fallbacks = ["#fbbf24","#60a5fa","#34d399","#c084fc","#f87171","#22d3ee","#fb923c"];
  return categoryColors[cat] || fallbacks[i % fallbacks.length];
}

export function TrendsPanel() {
  const [open, setOpen]                     = useState(false);
  const [tab, setTab]                       = useState<Tab>("keywords");
  const [window_, setWindow]                = useState<Window>("24");
  const [loading, setLoading]               = useState(false);
  const [keywords, setKeywords]             = useState<Keyword[]>([]);
  const [volume, setVolume]                 = useState<VolumePoint[]>([]);
  const [categories, setCategories]         = useState<CategoryTrend[]>([]);
  const [error, setError]                   = useState("");

  async function loadAll(hours: string) {
    setLoading(true);
    setError("");
    try {
      const [kwRes, volRes, catRes] = await Promise.all([
        fetch(`/api/trends/keywords?hours=${hours}&top_n=24`),
        fetch(`/api/trends/volume?hours=${hours}&bucket_hours=${hours === "168" ? "6" : "1"}`),
        fetch(`/api/trends?hours=${hours}`),
      ]);
      const [kw, vol, cat] = await Promise.all([kwRes.json(), volRes.json(), catRes.json()]);
      setKeywords(Array.isArray(kw) ? kw : []);
      setVolume(Array.isArray(vol) ? vol : []);
      setCategories(Array.isArray(cat) ? cat : []);
    } catch {
      setError("Trends unavailable");
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    loadAll(window_);
  }

  function handleWindow(w: Window) {
    setWindow(w);
    loadAll(w);
  }

  const maxKw  = keywords[0]?.count || 1;
  const maxVol = Math.max(...volume.map(v => v.count), 1);
  const maxCat = categories[0]?.count || 1;

  function fmtHour(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "keywords",   label: "Keywords",   icon: Tag      },
    { id: "volume",     label: "Volume",     icon: BarChart2 },
    { id: "categories", label: "Categories", icon: TrendingUp },
  ];

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-400/20 bg-emerald-400/8 text-emerald-400 text-sm font-medium hover:bg-emerald-400/15 transition-all duration-200"
      >
        <TrendingUp size={14} />
        Trends
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-white/10 bg-[rgb(18,18,22)] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
                <div className="flex items-center gap-3">
                  <TrendingUp size={16} className="text-emerald-400" />
                  <span className="text-sm font-medium text-white/80">Trend Analytics</span>
                  <span className="text-xs text-white/25">live from your news pipeline</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Time window picker */}
                  <div className="flex items-center gap-1 rounded-lg border border-white/8 bg-white/4 p-1">
                    <Clock size={11} className="text-white/25 ml-1" />
                    {(Object.keys(WINDOW_LABELS) as Window[]).map(w => (
                      <button
                        key={w}
                        onClick={() => handleWindow(w)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                          window_ === w
                            ? "bg-emerald-400/20 text-emerald-400"
                            : "text-white/35 hover:text-white/60"
                        }`}
                      >
                        {WINDOW_LABELS[w]}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60 ml-1">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/6 shrink-0">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-2 px-5 py-3 text-xs font-medium transition-all border-b-2 ${
                      tab === t.id
                        ? "border-emerald-400 text-emerald-400"
                        : "border-transparent text-white/30 hover:text-white/55"
                    }`}
                  >
                    <t.icon size={12} />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 p-5">
                {error && <p className="text-sm text-red-400/70 mb-4">{error}</p>}

                {loading ? (
                  <div className="flex items-center justify-center py-20 text-white/20 text-sm">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      <TrendingUp size={14} className="text-emerald-400/40" />
                    </motion.div>
                    Analysing pipeline…
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    {/* ── Keywords tab ── */}
                    {tab === "keywords" && (
                      <motion.div key="keywords" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <p className="text-xs text-white/25 mb-4">
                          Top words appearing in article titles in the last {WINDOW_LABELS[window_]}
                        </p>
                        {keywords.length === 0 ? (
                          <p className="text-sm text-white/20 text-center py-12">No data for this window</p>
                        ) : (
                          <div className="space-y-2.5">
                            {keywords.map((kw, i) => (
                              <motion.div
                                key={kw.word}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.025 }}
                                className="flex items-center gap-3"
                              >
                                <span className="text-xs text-white/25 w-5 text-right shrink-0">{i + 1}</span>
                                <span className="text-xs font-medium text-white/70 w-28 shrink-0 capitalize">{kw.word}</span>
                                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(kw.count / maxKw) * 100}%` }}
                                    transition={{ delay: 0.1 + i * 0.025, duration: 0.5, ease: "easeOut" }}
                                    className="h-full rounded-full"
                                    style={{
                                      background: `hsl(${160 - (i / keywords.length) * 60}, 70%, 60%)`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-white/30 w-6 text-right shrink-0">{kw.count}</span>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* ── Volume tab ── */}
                    {tab === "volume" && (
                      <motion.div key="volume" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <p className="text-xs text-white/25 mb-4">
                          Articles published per hour over the last {WINDOW_LABELS[window_]}
                        </p>
                        {volume.length === 0 ? (
                          <p className="text-sm text-white/20 text-center py-12">No data for this window</p>
                        ) : (
                          <>
                            {/* Bar chart */}
                            <div className="flex items-end gap-1 h-36 mb-2">
                              {volume.map((pt, i) => (
                                <motion.div
                                  key={pt.time}
                                  className="flex-1 flex flex-col items-center gap-1 group"
                                  title={`${fmtHour(pt.time)}: ${pt.count}`}
                                >
                                  <div className="relative w-full flex items-end" style={{ height: "120px" }}>
                                    <motion.div
                                      initial={{ height: 0 }}
                                      animate={{ height: `${(pt.count / maxVol) * 100}%` }}
                                      transition={{ delay: i * 0.02, duration: 0.5, ease: "easeOut" }}
                                      className="w-full rounded-t-sm bg-emerald-400/40 group-hover:bg-emerald-400/70 transition-colors"
                                      style={{ minHeight: pt.count > 0 ? "3px" : "0" }}
                                    />
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 rounded bg-[rgb(30,30,36)] border border-white/10 text-[10px] text-white/70 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                      {pt.count}
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                            {/* X axis labels — show a few evenly spaced */}
                            <div className="flex justify-between text-[10px] text-white/20 px-0.5">
                              {[0, Math.floor(volume.length / 3), Math.floor((2 * volume.length) / 3), volume.length - 1]
                                .filter((v, i, a) => a.indexOf(v) === i && volume[v])
                                .map(idx => (
                                  <span key={idx}>{fmtHour(volume[idx].time)}</span>
                                ))}
                            </div>
                            {/* Summary */}
                            <div className="mt-4 flex gap-4">
                              <div className="rounded-xl border border-white/5 bg-white/2 px-4 py-3 flex-1 text-center">
                                <p className="text-xl font-medium text-emerald-400">
                                  {volume.reduce((s, v) => s + v.count, 0)}
                                </p>
                                <p className="text-[10px] text-white/25 mt-0.5 uppercase tracking-wide">Total articles</p>
                              </div>
                              <div className="rounded-xl border border-white/5 bg-white/2 px-4 py-3 flex-1 text-center">
                                <p className="text-xl font-medium text-emerald-400">
                                  {Math.round(volume.reduce((s, v) => s + v.count, 0) / (volume.length || 1))}
                                </p>
                                <p className="text-[10px] text-white/25 mt-0.5 uppercase tracking-wide">Avg / hour</p>
                              </div>
                              <div className="rounded-xl border border-white/5 bg-white/2 px-4 py-3 flex-1 text-center">
                                <p className="text-xl font-medium text-emerald-400">{maxVol}</p>
                                <p className="text-[10px] text-white/25 mt-0.5 uppercase tracking-wide">Peak hour</p>
                              </div>
                            </div>
                          </>
                        )}
                      </motion.div>
                    )}

                    {/* ── Categories tab ── */}
                    {tab === "categories" && (
                      <motion.div key="categories" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <p className="text-xs text-white/25 mb-4">
                          Category breakdown for the last {WINDOW_LABELS[window_]}
                        </p>
                        {categories.length === 0 ? (
                          <p className="text-sm text-white/20 text-center py-12">No data for this window</p>
                        ) : (
                          <>
                            {/* Donut-style proportional bars */}
                            <div className="flex h-3 rounded-full overflow-hidden mb-5 gap-px">
                              {categories.map((cat, i) => (
                                <motion.div
                                  key={cat.category}
                                  initial={{ flex: 0 }}
                                  animate={{ flex: cat.count }}
                                  transition={{ delay: i * 0.05, duration: 0.6, ease: "easeOut" }}
                                  style={{ backgroundColor: getColor(cat.category, i) }}
                                  title={`${cat.category}: ${cat.count}`}
                                />
                              ))}
                            </div>

                            <div className="space-y-3">
                              {categories.map((cat, i) => (
                                <motion.div
                                  key={cat.category}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.04 }}
                                  className="flex items-center gap-3"
                                >
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: getColor(cat.category, i) }}
                                  />
                                  <span className="text-xs text-white/65 flex-1">{cat.category}</span>
                                  <div className="w-32 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${(cat.count / maxCat) * 100}%` }}
                                      transition={{ delay: 0.1 + i * 0.04, duration: 0.5, ease: "easeOut" }}
                                      className="h-full rounded-full"
                                      style={{ backgroundColor: getColor(cat.category, i) }}
                                    />
                                  </div>
                                  <span className="text-xs text-white/30 w-8 text-right">{cat.count}</span>
                                  <span className="text-[10px] text-white/18 w-10 text-right">
                                    {Math.round((cat.count / categories.reduce((s, c) => s + c.count, 0)) * 100)}%
                                  </span>
                                </motion.div>
                              ))}
                            </div>

                            {/* Sources active count */}
                            <div className="mt-5 pt-4 border-t border-white/5">
                              <p className="text-xs text-white/25 mb-3 uppercase tracking-widest">Sources active this window</p>
                              <div className="flex flex-wrap gap-1.5">
                                {Array.from(new Set(categories.flatMap(c => c.sources))).sort().map(src => (
                                  <span key={src} className="px-2 py-1 rounded-full bg-white/4 border border-white/8 text-[11px] text-white/40">
                                    {src}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
