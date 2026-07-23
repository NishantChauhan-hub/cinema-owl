const express = require("express");
const axios = require("axios");
const { authMiddleware } = require("../middleware/auth");
const WatchedItem = require("../models/WatchedItem");

const router = express.Router();

// ─── GET /api/watched ────────────────────────────────────────────────────────
router.get("/", authMiddleware, async (req, res) => {
  try {
    const list = await WatchedItem.find({ userId: req.user.userId }).sort({ addedAt: -1 });
    res.json({ watched: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch watched list" });
  }
});

// ─── POST /api/watched ────────────────────────────────────────────────────────
router.post("/", authMiddleware, async (req, res) => {
  const { titleId, titleType, titleName, posterUrl, tmdbId } = req.body;
  if (!titleId || !titleName) {
    return res.status(400).json({ error: "titleId and titleName required" });
  }
  try {
    const item = new WatchedItem({
      userId: req.user.userId,
      title_id: titleId,
      title_type: titleType || "movie",
      title_name: titleName,
      poster_url: posterUrl,
      tmdb_id: tmdbId
    });
    await item.save();
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 11000) return res.json({ ok: true }); // Already in list
    console.error(err);
    res.status(500).json({ error: "Failed to add to watched list" });
  }
});

// ─── DELETE /api/watched ──────────────────────────────────────────────────────
router.delete("/", authMiddleware, async (req, res) => {
  const { titleId } = req.body;
  if (!titleId) {
    return res.status(400).json({ error: "titleId required" });
  }
  try {
    await WatchedItem.findOneAndDelete({ userId: req.user.userId, title_id: titleId });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove from watched list" });
  }
});

// Fallback models to try in case of quota or 404 errors
const MODEL_CANDIDATES = [
  { api: "v1beta", model: "gemini-2.5-flash" },
  { api: "v1beta", model: "gemini-2.0-flash" },
  { api: "v1beta", model: "gemini-2.0-flash-001" },
  { api: "v1beta", model: "gemini-flash-latest" },
  { api: "v1beta", model: "gemini-2.0-flash-lite" },
  { api: "v1beta", model: "gemini-flash-lite-latest" },
];

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  let lastErr;

  for (const { api, model } of MODEL_CANDIDATES) {
    const url = `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${key}`;
    try {
      const { data } = await axios.post(url, {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 4000, temperature: 0.85 },
      }, { timeout: 20000 });

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) {
        return text;
      }
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message || err.message;
      lastErr = new Error(`${model}: ${msg}`);
      if (status === 400 || status === 403) break;
    }
  }
  throw lastErr || new Error("All Gemini models unavailable");
}

// ─── POST /api/watched/season-news ──────────────────────────────────
// AI agent checks upcoming season news for shows/anime sent from the frontend
router.post("/season-news", authMiddleware, async (req, res) => {
  try {
    const seriesList = req.body.shows || [];

    if (!seriesList.length) {
      return res.json({
        news: [],
        message: "No shows or anime in your watched list yet — add some series to track upcoming seasons!",
      });
    }

    const titleList = seriesList.map((t) => `- ${t.title_name} (${t.title_type})`).join("\n");

    const prompt = `You are an entertainment news AI assistant for CinemaOwl. The user has watched the following TV shows and anime and wants to know about upcoming seasons or continuations:

${titleList}

For EACH title in the list, provide:
1. Whether there is a confirmed upcoming season or continuation
2. Any known release date or window
3. Any relevant recent news (renewals, cancellations, cast news)
4. A brief status summary

Be accurate and honest — if you don't have recent info about a specific title, say so clearly. Use your knowledge up to your training cutoff.

Respond in JSON format like this:
{
  "results": [
    {
      "title": "Show Name",
      "type": "show" or "anime",
      "status": "confirmed" | "rumored" | "cancelled" | "ongoing" | "unknown",
      "season_info": "Season 3 confirmed for Q2 2025",
      "news": "Brief news summary here",
      "hype_level": "high" | "medium" | "low"
    }
  ],
  "summary": "One overall summary sentence about the batch"
}`;

    const text = await callGemini(prompt);

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("AI returned non-JSON:", text);
      return res.status(500).json({ error: `AI could not parse news data. Raw output: ${text.slice(0, 100)}` });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    res.json(parsed);
  } catch (err) {
    console.error("Season news error:", err.message);
    res.status(500).json({ error: `AI Error: ${err.message}` });
  }
});

module.exports = router;
