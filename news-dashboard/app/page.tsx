"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, SlidersHorizontal, ChevronDown, LayoutGrid, List, Newspaper, Radio } from "lucide-react";
import { Header } from "@/components/Header";
import { StatsBar } from "@/components/StatsBar";
import { NewsCard, NewsCardSkeleton, NewsRow, NewsItem } from "@/components/NewsCard";
import { SourceChart } from "@/components/SourceChart";
import { SemanticSearch } from "@/components/SemanticSearch";
import { ClustersPanel } from "@/components/ClustersPanel";
import { RelatedPanel } from "@/components/RelatedPanel";
import { NewsChat } from "@/components/NewsChat";
import { TrendsPanel } from "@/components/TrendsPanel";

type SortKey = "newest" | "oldest" | "source" | "category";
type ViewMode = "grid" | "list";

const categoryConfig: Record<string, { color: string; active: string; dot: string }> = {
  All:            { color: "text-white/50",        active: "bg-amber-400/15 text-amber-400 border-amber-400/30",       dot: "bg-amber-400" },
  Technology:     { color: "text-blue-400/70",     active: "bg-blue-400/15 text-blue-400 border-blue-400/30",          dot: "bg-blue-400" },
  Politics:       { color: "text-purple-400/70",   active: "bg-purple-400/15 text-purple-400 border-purple-400/30",    dot: "bg-purple-400" },
  Business:       { color: "text-amber-400/70",    active: "bg-amber-400/15 text-amber-400 border-amber-400/30",       dot: "bg-amber-400" },
  "General News": { color: "text-emerald-400/70",  active: "bg-emerald-400/15 text-emerald-400 border-emerald-400/30", dot: "bg-emerald-400" },
  Science:        { color: "text-cyan-400/70",     active: "bg-cyan-400/15 text-cyan-400 border-cyan-400/30",          dot: "bg-cyan-400" },
  Health:         { color: "text-rose-400/70",     active: "bg-rose-400/15 text-rose-400 border-rose-400/30",          dot: "bg-rose-400" },
  Sports:         { color: "text-orange-400/70",   active: "bg-orange-400/15 text-orange-400 border-orange-400/30",    dot: "bg-orange-400" },
  Entertainment:  { color: "text-pink-400/70",     active: "bg-pink-400/15 text-pink-400 border-pink-400/30",          dot: "bg-pink-400" },
};

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "newest",   label: "Newest first" },
  { value: "oldest",   label: "Oldest first" },
  { value: "source",   label: "Source A–Z" },
  { value: "category", label: "Category A–Z" },
];

export default function Dashboard() {
  const [news, setNews]           = useState<NewsItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [category, setCategory]   = useState("All");
  const [source, setSource]       = useState("All");
  const [search, setSearch]       = useState("");
  const [sort, setSort]           = useState<SortKey>("newest");
  const [sortOpen, setSortOpen]   = useState(false);
  const [limit, setLimit]         = useState(24);
  const [view, setView]           = useState<ViewMode>("grid");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Recommendations
  const [recommendId, setRecommendId]       = useState<string | null>(null);
  const [recommendTitle, setRecommendTitle] = useState("");

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      const res    = await fetch(`/api/news?${params}`);
      const text   = await res.text();
      let data: unknown;
      try { data = JSON.parse(text); }
      catch { setError(`Server returned non-JSON (status ${res.status})`); return; }
      if (!res.ok) { setError(`API error ${res.status}`); return; }
      setNews(Array.isArray(data) ? (data as NewsItem[]) : []);
    } catch (e) {
      console.error(e);
      setError("Could not reach the API.");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  useEffect(() => {
    if (!sortOpen) return;
    const h = () => setSortOpen(false);
    window.addEventListener("click", h);
    return () => window.removeEventListener("click", h);
  }, [sortOpen]);

  const allCategories = useMemo(() => ["All", ...Array.from(new Set(news.map(n => n.category))).sort()], [news]);
  const allSources    = useMemo(() => ["All", ...Array.from(new Set(news.map(n => n.source))).sort()],   [news]);

  const categoryCounts = useMemo(() => news.reduce<Record<string, number>>((acc, n) => {
    acc["All"] = (acc["All"] || 0) + 1;
    acc[n.category] = (acc[n.category] || 0) + 1;
    return acc;
  }, {}), [news]);

  const sourceCounts = useMemo(() => news.reduce<Record<string, number>>((acc, n) => {
    acc["All"] = (acc["All"] || 0) + 1;
    acc[n.source] = (acc[n.source] || 0) + 1;
    return acc;
  }, {}), [news]);

  const sources    = useMemo(() => news.reduce<Record<string, number>>((acc, n) => { acc[n.source] = (acc[n.source] || 0) + 1; return acc; }, {}), [news]);
  const categories = useMemo(() => news.reduce<Record<string, number>>((acc, n) => { acc[n.category] = (acc[n.category] || 0) + 1; return acc; }, {}), [news]);

  const processed = useMemo(() => {
    let items = news;
    if (category !== "All") items = items.filter(n => n.category === category);
    if (source   !== "All") items = items.filter(n => n.source   === source);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.source.toLowerCase().includes(q)
      );
    }
    return [...items].sort((a, b) => {
      if (sort === "newest")   return new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime();
      if (sort === "oldest")   return new Date(a.scraped_at).getTime() - new Date(b.scraped_at).getTime();
      if (sort === "source")   return a.source.localeCompare(b.source);
      if (sort === "category") return a.category.localeCompare(b.category);
      return 0;
    });
  }, [news, category, source, search, sort]);

  const hasFilters   = category !== "All" || source !== "All" || !!search;
  const currentSort  = sortOptions.find(o => o.value === sort)!;

  function handleRecommend(id: string, title: string) {
    if (recommendId === id) { setRecommendId(null); setRecommendTitle(""); }
    else { setRecommendId(id); setRecommendTitle(title); }
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-amber-500/3 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-500/3 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/2 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header onRefresh={fetchNews} loading={loading} />

        <StatsBar total={news.length} categories={categories} sources={Object.keys(sources).length} />

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mb-6 flex items-center justify-between px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
              <span>⚠ {error}</span>
              <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-400 ml-4"><X size={14} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Category pills ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Newspaper size={11} className="text-white/20" />
            <span className="text-[10px] text-white/25 tracking-widest uppercase font-medium">Category</span>
          </div>
          <div className="overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
            <div className="flex gap-2 w-max">
              {allCategories.map(cat => {
                const cfg    = categoryConfig[cat] || categoryConfig["All"];
                const active = category === cat;
                return (
                  <motion.button key={cat} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setCategory(cat)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 whitespace-nowrap ${
                      active ? cfg.active : `border-white/8 bg-white/4 ${cfg.color} hover:border-white/15 hover:bg-white/7`
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${active ? "opacity-100" : "opacity-40"}`} />
                    {cat}
                    <span className={`text-[10px] ${active ? "opacity-70" : "opacity-40"}`}>{categoryCounts[cat] || 0}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ── Source pills ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Radio size={11} className="text-white/20" />
            <span className="text-[10px] text-white/25 tracking-widest uppercase font-medium">Source</span>
          </div>
          <div className="overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
            <div className="flex gap-2 w-max">
              {allSources.map(src => {
                const active = source === src;
                return (
                  <motion.button key={src} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setSource(src)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 whitespace-nowrap ${
                      active ? "bg-white/12 text-white border-white/25" : "border-white/8 bg-white/4 text-white/40 hover:border-white/15 hover:bg-white/7 hover:text-white/60"
                    }`}>
                    {src !== "All" && <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-white" : "bg-white/30"}`} />}
                    {src}
                    <span className={`text-[10px] ${active ? "opacity-60" : "opacity-40"}`}>{sourceCounts[src] || 0}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Mobile sidebar */}
          <div className="lg:hidden">
            <button onClick={() => setSidebarOpen(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/8 bg-white/4 text-sm text-white/50 hover:text-white/70 transition-colors mb-4">
              <SlidersHorizontal size={14} />
              Sources breakdown
              <ChevronDown size={14} className={`ml-auto transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4 space-y-4">
                  <SourceChart sources={sources} onSourceClick={(s) => setSource(s === source ? "All" : s)} activeSource={source} />
                  <LimitPicker limit={limit} setLimit={setLimit} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop sidebar */}
          <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="hidden lg:flex flex-col w-56 shrink-0 space-y-4">
            <SourceChart sources={sources} onSourceClick={(s) => setSource(s === source ? "All" : s)} activeSource={source} />
            <LimitPicker limit={limit} setLimit={setLimit} />
          </motion.aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="flex flex-col sm:flex-row gap-3 mb-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                <input type="text" placeholder="Search stories, sources…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[rgb(20,20,24)] border border-white/8 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-amber-400/30 transition-all duration-200" />
                <AnimatePresence>
                  {search && (
                    <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      <X size={14} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* AI tools */}
              <SemanticSearch />
              <ClustersPanel />
              <TrendsPanel />

              {/* Sort */}
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSortOpen(v => !v)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgb(20,20,24)] border border-white/8 text-sm text-white/60 hover:text-white hover:border-white/15 transition-all duration-200 whitespace-nowrap">
                  <SlidersHorizontal size={13} />
                  {currentSort.label}
                  <ChevronDown size={13} className={`transition-transform ${sortOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {sortOpen && (
                    <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-white/10 bg-[rgb(22,22,26)] shadow-xl z-20 overflow-hidden">
                      {sortOptions.map(opt => (
                        <button key={opt.value} onClick={() => { setSort(opt.value); setSortOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sort === opt.value ? "text-amber-400 bg-amber-400/8" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* View toggle */}
              <div className="flex rounded-xl border border-white/8 overflow-hidden">
                <button onClick={() => setView("grid")} className={`px-3 py-2.5 transition-colors ${view === "grid" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}>
                  <LayoutGrid size={15} />
                </button>
                <button onClick={() => setView("list")} className={`px-3 py-2.5 transition-colors ${view === "list" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}>
                  <List size={15} />
                </button>
              </div>
            </motion.div>

            {/* Active filters */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="text-xs text-white/25">
                {loading ? "Loading…" : `${processed.length} ${processed.length === 1 ? "story" : "stories"}`}
                {search && ` matching "${search}"`}
              </span>
              <AnimatePresence>
                {category !== "All" && (
                  <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => setCategory("All")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[11px] font-medium hover:bg-amber-400/20 transition-colors">
                    {category} <X size={9} />
                  </motion.button>
                )}
                {source !== "All" && (
                  <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => setSource("All")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/8 border border-white/15 text-white/60 text-[11px] font-medium hover:bg-white/12 transition-colors">
                    {source} <X size={9} />
                  </motion.button>
                )}
              </AnimatePresence>
              {hasFilters && (
                <button onClick={() => { setCategory("All"); setSource("All"); setSearch(""); }}
                  className="text-xs text-white/20 hover:text-white/45 underline underline-offset-2 transition-colors">
                  Clear all
                </button>
              )}
            </div>

            {/* Content + Related panel side by side */}
            <div className="flex gap-4">
              <div className="flex-1 min-w-0">
                {loading ? (
                  <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
                    {Array.from({ length: 9 }).map((_, i) => <NewsCardSkeleton key={i} index={i} />)}
                  </div>
                ) : processed.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="text-4xl mb-4 opacity-30">◎</div>
                    <p className="text-white/30 text-sm">No stories found</p>
                    {hasFilters && (
                      <button onClick={() => { setCategory("All"); setSource("All"); setSearch(""); }}
                        className="mt-3 text-xs text-amber-400/60 hover:text-amber-400 transition-colors">
                        Clear all filters
                      </button>
                    )}
                  </motion.div>
                ) : view === "grid" ? (
                  <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                      {processed.map((item, i) => (
                        <NewsCard key={item._id} item={item} index={i}
                          onSourceClick={(s) => setSource(s)}
                          onRecommend={handleRecommend}
                          activeRecommend={recommendId} />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div layout className="flex flex-col gap-3">
                    <AnimatePresence mode="popLayout">
                      {processed.map((item, i) => (
                        <NewsRow key={item._id} item={item} index={i}
                          onSourceClick={(s) => setSource(s)}
                          onRecommend={handleRecommend}
                          activeRecommend={recommendId} />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>

              {/* Related articles panel */}
              <RelatedPanel
                articleId={recommendId}
                articleTitle={recommendTitle}
                onClose={() => { setRecommendId(null); setRecommendTitle(""); }}
              />
            </div>
          </div>
        </div>

        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="mt-16 pb-8 flex items-center justify-between text-xs text-white/15">
          <span>MongoDB × FastAPI × Next.js</span>
          <span>Live data pipeline</span>
        </motion.footer>
      </div>

      <NewsChat />
    </div>
  );
}

function LimitPicker({ limit, setLimit }: { limit: number; setLimit: (n: number) => void }) {
  return (
    <div className="rounded-xl border border-white/5 bg-[rgb(20,20,24)] p-5">
      <h3 className="text-xs font-medium tracking-widest uppercase text-white/30 mb-3">Items per page</h3>
      <div className="flex gap-2 flex-wrap">
        {[12, 24, 50, 100].map(n => (
          <button key={n} onClick={() => setLimit(n)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              limit === n ? "bg-amber-400/20 text-amber-400 border border-amber-400/30" : "bg-white/5 text-white/40 border border-transparent hover:text-white/60"
            }`}>{n}</button>
        ))}
      </div>
    </div>
  );
}
