const express = require("express");
const axios = require("axios");
const { saveMessage, getHistory, getWatched } = require("../db/database");

const router = express.Router();

// Confirmed working models for this API key (verified via ListModels)
// gemini-2.5-flash confirmed responding — put first to skip failed attempts
const MODEL_CANDIDATES = [
  { api: "v1beta", model: "gemini-2.5-flash" },
  { api: "v1beta", model: "gemini-2.0-flash" },
  { api: "v1beta", model: "gemini-2.0-flash-001" },
  { api: "v1beta", model: "gemini-flash-latest" },
  { api: "v1beta", model: "gemini-2.0-flash-lite" },
  { api: "v1beta", model: "gemini-flash-lite-latest" },
];

const SYSTEM_PROMPT = `You are Owl — the AI brain powering CinemaOwl, a futuristic movie, TV show, and anime discovery platform. You are knowledgeable, sharp, and have a distinct personality: casual, witty, and always deliver real, accurate answers.

You know about films, television, and anime: plots, scenes, cast, directors, production studios, ratings, streaming availability, and upcoming releases.

Voice: casual and warm, occasionally uses light slang and emoji, but always delivers substantive answers.

When asked for recommendations: suggest 1-3 specific real titles with a short description and where to watch.
When asked about upcoming seasons: share what you know and be honest if info might be outdated.
When given a user's saved list: reference it for personalised recommendations.
If you do not know recent info, say so instead of guessing.`;

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  let lastErr;

  for (const { api, model } of MODEL_CANDIDATES) {
    const url = `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${key}`;
    try {
      const { data } = await axios.post(url, {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 800, temperature: 0.85 },
      }, { timeout: 20000 });

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) {
        console.log(`✓ Gemini OK — ${api}/${model}`);
        return text;
      }
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message || err.message;
      console.warn(`  ✗ ${api}/${model} [${status}]: ${msg?.slice(0, 80)}`);
      lastErr = new Error(`${model}: ${msg}`);
      // Stop on authentication errors only — keep trying on quota/404
      if (status === 400 || status === 403) {
        console.error("Auth error — check your GEMINI_API_KEY");
        break;
      }
    }
  }
  throw lastErr || new Error("All Gemini models unavailable");
}

router.post("/", async (req, res) => {
  const { sessionId, message, context } = req.body;
  if (!sessionId || !message) {
    return res.status(400).json({ error: "sessionId and message required" });
  }

  try {
    saveMessage(sessionId, "user", message, context?.id || null);

    const history = getHistory(sessionId, 16);
    const recentHistory = history.slice(0, -1);
    const convText = recentHistory.length > 0
      ? "\n\nConversation so far:\n" +
        recentHistory.map(m => (m.role === "owl" ? "Owl" : "User") + ": " + m.content).join("\n")
      : "";

    const watched = getWatched(sessionId);
    const watchedCtx = watched.length > 0
      ? "\n\nUser's saved list: " + watched.map(w => w.title_name + " (" + w.title_type + ")").join(", ") + "."
      : "";

    const detailCtx = context
      ? `\n\n[Currently viewing: "${context.title}" (${context.type}), ${context.rating}/10. ${context.blurb}]`
      : "";

    const fullPrompt = SYSTEM_PROMPT + watchedCtx + convText + detailCtx + "\n\nUser: " + message + "\nOwl:";

    const reply = await callGemini(fullPrompt);
    saveMessage(sessionId, "owl", reply, context?.id || null);
    res.json({ reply });

  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ error: "Owl could not respond.", detail: err.message });
  }
});

router.get("/:sessionId", (req, res) => {
  res.json({ history: getHistory(req.params.sessionId, 200) });
});

module.exports = router;
