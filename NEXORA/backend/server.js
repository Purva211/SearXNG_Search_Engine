require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

const app = express();
const PORT = Number(process.env.PORT || 5000);
const SEARXNG_URL = (process.env.SEARXNG_URL || "http://localhost:54321").replace(/\/$/, "");
const CLIENT_ORIGINS = [
  "https://searxng-search-engine-3.onrender.com",
  ...(process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim()),
];

app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGINS }));
app.use(express.json({ limit: "20kb" }));
app.use("/api", rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false }));

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "NEXORA API", searxng: SEARXNG_URL }));

async function searchSearxng(query, category = "general") {
  const categories = ["general", "images", "news"].includes(category) ? category : "general";
  const response = await axios.get(`${SEARXNG_URL}/search`, {
    params: { q: query, format: "json", categories },
    timeout: 20000,
    headers: { Accept: "application/json" }
  });
  return (response.data.results || []).map((item) => ({
    title: item.title || "Untitled result",
    url: item.url,
    content: item.content || "",
    engine: item.engine || "",
    category: item.category || categories,
    publishedDate: item.publishedDate || null,
    img_src: item.img_src || null,
    thumbnail: item.thumbnail || null
  }));
}

app.get("/api/search", async (req, res) => {
  const query = String(req.query.q || "").trim();
  const category = String(req.query.category || "general");
  if (!query) return res.status(400).json({ error: "Enter a search query." });
  if (query.length > 300) return res.status(400).json({ error: "Search query is too long." });
  try {
    const results = await searchSearxng(query, category);
    res.json({ query, category, count: results.length, results });
  } catch (error) {
    const status = error.response?.status || 502;
    res.status(502).json({ error: "Could not fetch results from SearXNG. Check that the SearXNG container is running and JSON format is enabled.", detail: error.code || error.message, upstreamStatus: status });
  }
});

app.post("/api/ai-search", async (req, res) => {
  const query = String(req.body?.query || "").trim();
  if (!query) return res.status(400).json({ error: "Enter a question." });
  if (query.length > 300) return res.status(400).json({ error: "Question is too long (maximum 300 characters)." });
  try {
    const results = await searchSearxng(query, "general");
    if (!results.length) return res.json({ query, answer: "No search results were found. Try a different query.", results: [], aiPowered: false });

    // If configured, use Groq to synthesize an answer grounded in retrieved search snippets.
    if (process.env.GROQ_API_KEY) {
      const snippets = results.slice(0, 8).map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\nSnippet: ${r.content}`).join("\n\n");
      const completion = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        temperature: 0.2,
        messages: [
          { role: "system", content: "Answer the user's question using only the supplied web search results. If the sources do not contain the answer, say so. Cite claims with source numbers like [1]. Do not invent facts." },
          { role: "user", content: `Question: ${query}

Search results:
${snippets}` }
        ]
      }, { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, timeout: 45000 });
      return res.json({ query, answer: completion.data.choices?.[0]?.message?.content || "No answer generated.", results: results.slice(0, 8), aiPowered: true });
    }

    const answer = `I found ${results.length} web results for “${query}”. Here are the most relevant sources. Add a GROQ_API_KEY to backend/.env to enable AI-generated answers with source citations.`;
    res.json({ query, answer, results: results.slice(0, 8), aiPowered: false });
  } catch (error) {
    res.status(502).json({ error: "AI search could not complete. Check SearXNG and, if configured, your Groq API key.", detail: error.response?.data?.error || error.code || error.message });
  }
});

app.listen(PORT, () => console.log(`NEXORA API running at http://localhost:${PORT}`));
