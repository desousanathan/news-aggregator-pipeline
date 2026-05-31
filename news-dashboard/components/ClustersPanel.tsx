"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Network, X, ChevronDown, ChevronRight } from "lucide-react";

interface ClusterArticle {
  _id: string;
  title: string;
  source: string;
  category: string;
}

const clusterColors = [
  "bg-blue-400", "bg-amber-400", "bg-emerald-400", "bg-purple-400",
  "bg-rose-400", "bg-cyan-400", "bg-orange-400", "bg-lime-400",
];

export function ClustersPanel() {
  const [open, setOpen]           = useState(false);
  const [clusters, setClusters]   = useState<ClusterArticle[][]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [expanded, setExpanded]   = useState<number | null>(null);
  const [nClusters, setNClusters] = useState(8);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`/api/clusters?n_clusters=${nClusters}`);
      const data = await res.json();
      if (data.error) { setError(data.error); setClusters([]); }
      else setClusters(Array.isArray(data) ? data : []);
    } catch {
      setError("Clustering unavailable");
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    if (clusters.length === 0) load();
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-400/20 bg-purple-400/8 text-purple-400 text-sm font-medium hover:bg-purple-400/15 transition-all duration-200"
      >
        <Network size={14} />
        Clusters
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[80vh] rounded-2xl border border-white/10 bg-[rgb(18,18,22)] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
                <div className="flex items-center gap-3">
                  <Network size={16} className="text-purple-400" />
                  <span className="text-sm font-medium text-white/80">Topic Clusters</span>
                  <span className="text-xs text-white/25">AI-grouped by semantic similarity</span>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={nClusters}
                    onChange={e => setNClusters(Number(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/60 focus:outline-none"
                  >
                    {[4,6,8,10,12].map(n => <option key={n} value={n}>{n} clusters</option>)}
                  </select>
                  <button onClick={load} disabled={loading}
                    className="text-xs px-3 py-1 rounded-lg bg-purple-400/15 text-purple-400 hover:bg-purple-400/25 transition-colors disabled:opacity-50">
                    {loading ? "Loading…" : "Refresh"}
                  </button>
                  <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 p-4 space-y-2">
                {error && <p className="text-sm text-red-400/70 px-2">{error}</p>}
                {loading && !clusters.length && (
                  <div className="flex items-center justify-center py-16 text-white/25 text-sm">
                    Clustering articles…
                  </div>
                )}
                {clusters.map((cluster, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-white/5 bg-white/2 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpanded(expanded === i ? null : i)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/4 transition-colors text-left"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${clusterColors[i % clusterColors.length]}`} />
                      <span className="text-sm text-white/70 font-medium flex-1">
                        Cluster {i + 1}
                      </span>
                      <span className="text-xs text-white/30 mr-2">{cluster.length} articles</span>
                      {expanded === i
                        ? <ChevronDown size={14} className="text-white/30" />
                        : <ChevronRight size={14} className="text-white/30" />
                      }
                    </button>

                    <AnimatePresence>
                      {expanded === i && (
                        <motion.div
                          initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 space-y-2">
                            {cluster.slice(0, 8).map((article, j) => (
                              <div key={j} className="flex items-start gap-2">
                                <span className="text-white/15 text-xs mt-0.5 shrink-0">·</span>
                                <p className="text-xs text-white/50 leading-snug line-clamp-1">{article.title}</p>
                                <span className="text-[10px] text-white/20 shrink-0 ml-auto">{article.source}</span>
                              </div>
                            ))}
                            {cluster.length > 8 && (
                              <p className="text-xs text-white/20 pl-3">+{cluster.length - 8} more</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
