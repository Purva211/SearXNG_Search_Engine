import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { searchWeb } from "./api/search.js";
import {
  Search,
  Sparkles,
  Sun,
  Moon,
  History,
  ArrowUpRight,
  Globe2,
  Image as ImageIcon,
  Newspaper,
  X,
  Clock3,
  ExternalLink,
  LoaderCircle,
  Command,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const tabs = [
  { id: "general", label: "Web", icon: Globe2 },
  { id: "images", label: "Images", icon: ImageIcon },
  { id: "news", label: "News", icon: Newspaper },
];

export default function App() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [results, setResults] = useState([]);
  const [answer, setAnswer] = useState("");
  const [aiPowered, setAiPowered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState(() =>
    JSON.parse(localStorage.getItem("nexora-history") || "[]"),
  );
  const [theme, setTheme] = useState(
    () => localStorage.getItem("nexora-theme") || "dark",
  );
  const [aiMode, setAiMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("nexora-theme", theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem("nexora-history", JSON.stringify(history));
  }, [history]);

  const suggestions = useMemo(
    () => [
      "Latest AI developments",
      "React and Vite tutorials",
      "Docker Compose guide",
      "Cloud computing trends",
    ],
    [],
  );

  async function runSearch(value = query, useAI = false, category = activeTab) {
    const clean = value.trim();
    if (!clean) return;
    setQuery(clean);
    setLoading(true);
    setError("");
    setResults([]);
    setAnswer("");
    setSearched(true);
    setAiMode(useAI);
    setHistory((old) =>
      [
        clean,
        ...old.filter((item) => item.toLowerCase() !== clean.toLowerCase()),
      ].slice(0, 20),
    );
    try {
      if (useAI) {
        const { data } = await axios.post(`${API}/api/ai-search`, {
          query: clean,
        });
        setAnswer(data.answer);
        setResults(data.results || []);
        setAiPowered(Boolean(data.aiPowered));
      } else {
        const data = await searchWeb(clean, category);
        setResults(data.results || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to reach NEXORA. Make sure the backend and SearXNG are running.",
      );
    } finally {
      setLoading(false);
    }
  }

  function selectTab(tab) {
    setActiveTab(tab);
    if (searched && query.trim()) runSearch(query, false, tab);
  }
  function clearHistory() {
    setHistory([]);
    localStorage.removeItem("nexora-history");
  }

  return (
    <div className="min-h-screen overflow-hidden">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 md:px-8">
        <button
          onClick={() => {
            setSearched(false);
            setResults([]);
            setAnswer("");
            setError("");
          }}
          className="flex items-center gap-3"
          aria-label="NEXORA home"
        >
          <span className="brand-mark">
            <Command size={21} />
          </span>
          <span className="text-xl font-bold tracking-[0.2em]">NEXORA</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            className="icon-button"
            onClick={() => setHistoryOpen(true)}
            title="Search history"
          >
            <History size={18} />
            <span className="hidden sm:inline">History</span>
          </button>
          <button
            className="icon-button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-24 pt-14 md:px-8 md:pt-24">
        {!searched && (
          <section className="mx-auto max-w-3xl text-center">
            <div className="eyebrow">
              <span className="pulse-dot" /> YOUR WINDOW TO THE WEB
            </div>
            <h1 className="hero-title mt-7">
              Explore beyond
              <br />
              <span>the ordinary.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-7 muted">
              A smarter way to discover the web. Search across sources, explore
              ideas, and find what matters.
            </p>
          </section>
        )}

        <section
          className={`search-shell mx-auto ${searched ? "mt-4" : "mt-12"}`}
        >
          <form
            className="search-form"
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(query, false, activeTab);
            }}
          >
            <Search className="ml-2 shrink-0 text-slate-400" size={21} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anything on the internet..."
              aria-label="Search the web"
            />
            {query && (
              <button
                type="button"
                className="clear-query"
                onClick={() => setQuery("")}
              >
                <X size={17} />
              </button>
            )}
            <button
              className="search-submit"
              type="submit"
              disabled={loading || !query.trim()}
            >
              <Search size={17} />
              <span>Search</span>
            </button>
          </form>
          <div className="search-bottom">
            <span className="tiny-muted">POWERED BY SEARXNG</span>
            <button
              className="ai-button"
              onClick={() => runSearch(query, true)}
              disabled={loading || !query.trim()}
            >
              <Sparkles size={16} /> Ask NEXORA AI
            </button>
          </div>
        </section>

        {!searched && (
          <section className="mx-auto mt-9 max-w-3xl">
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.18em] muted">
              Try searching for
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => runSearch(s)}
                  className="suggestion-chip"
                >
                  {s}
                  <ArrowUpRight size={13} />
                </button>
              ))}
            </div>
          </section>
        )}

        {searched && (
          <section className="mt-10">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex flex-wrap gap-2">
                {tabs.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => selectTab(t.id)}
                      className={`tab-button ${activeTab === t.id && !aiMode ? "active" : ""}`}
                    >
                      <Icon size={16} />
                      {t.label}
                    </button>
                  );
                })}
                <button
                  onClick={() => runSearch(query, true)}
                  className={`tab-button ${aiMode ? "active" : ""}`}
                >
                  <Sparkles size={16} />
                  AI Search
                </button>
              </div>
              <span className="tiny-muted">RESULTS FOR “{query}”</span>
            </div>
            {loading && (
              <div className="flex items-center justify-center gap-3 py-16 muted">
                <LoaderCircle className="animate-spin" /> Searching the web...
              </div>
            )}
            {error && <div className="error-panel">{error}</div>}
            {!loading && !error && answer && (
              <div className="answer-card mb-7">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Sparkles size={17} className="text-violet-400" /> NEXORA AI{" "}
                  {aiPowered && <span className="ai-tag">AI GENERATED</span>}
                </div>
                <p className="whitespace-pre-wrap leading-7">{answer}</p>
                {!aiPowered && (
                  <p className="mt-3 text-xs muted">
                    This is a search overview, not an AI-generated answer.
                    Configure Groq to enable grounded AI summaries.
                  </p>
                )}
              </div>
            )}
            {!loading && !error && results.length === 0 && (
              <p className="py-12 text-center muted">
                No results found. Try another search.
              </p>
            )}
            <div
              className={
                activeTab === "images" && !aiMode
                  ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
                  : "space-y-4"
              }
            >
              {results.map((r, i) =>
                activeTab === "images" && !aiMode ? (
                  <a
                    key={`${r.url}-${i}`}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="image-result"
                  >
                    {r.img_src || r.thumbnail ? (
                      <img
                        src={r.img_src || r.thumbnail}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <div className="image-placeholder">
                        <ImageIcon />
                      </div>
                    )}
                    <span>{r.title}</span>
                  </a>
                ) : (
                  <article key={`${r.url}-${i}`} className="result-card">
                    <div className="mb-2 flex items-center gap-2 text-xs muted">
                      <Globe2 size={13} />
                      <span className="truncate">
                        {r.engine ||
                          (r.url ? new URL(r.url).hostname : "Web result")}
                      </span>
                      {r.publishedDate && (
                        <>
                          <span>·</span>
                          <span>{r.publishedDate}</span>
                        </>
                      )}
                    </div>
                    <a
                      className="result-title"
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {r.title}
                      <ExternalLink size={14} />
                    </a>
                    <p className="mt-2 text-sm leading-6 muted">{r.content}</p>
                    {r.url && (
                      <a
                        className="result-url mt-3 inline-flex items-center gap-1"
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {r.url}
                        <ArrowUpRight size={13} />
                      </a>
                    )}
                  </article>
                ),
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="relative z-10 border-t border-white/10 px-5 py-6 text-center text-xs muted">
        NEXORA <span className="mx-2">·</span> Private discovery, powered by
        open search.
      </footer>

      {historyOpen && (
        <div
          className="fixed inset-0 z-30 flex justify-end bg-black/50"
          onClick={() => setHistoryOpen(false)}
        >
          <aside
            className="history-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Clock3 size={19} /> Search history
              </div>
              <button
                className="icon-button"
                onClick={() => setHistoryOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-6 space-y-1">
              {history.length ? (
                history.map((item, i) => (
                  <button
                    key={`${item}-${i}`}
                    className="history-item"
                    onClick={() => {
                      setHistoryOpen(false);
                      runSearch(item);
                    }}
                  >
                    <History size={15} />
                    <span>{item}</span>
                    <ArrowUpRight size={14} />
                  </button>
                ))
              ) : (
                <p className="py-8 text-center text-sm muted">
                  Your recent searches will appear here.
                </p>
              )}
            </div>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="mt-6 w-full rounded-xl border border-white/10 py-3 text-sm muted hover:text-red-400"
              >
                Clear search history
              </button>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
