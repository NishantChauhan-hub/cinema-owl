const express = require("express");
const axios = require("axios");
const { optionalAuth, authMiddleware } = require("../middleware/auth");
const ChatMessage = require("../models/ChatMessage");
const WatchedItem = require("../models/WatchedItem");

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

router.post("/", optionalAuth, async (req, res) => {
  const { message, context, watched: clientWatched } = req.body;
  if (!message) {
    return res.status(400).json({ error: "message required" });
  }

  try {
    let recentHistory = [];
    let watchedList = clientWatched || [];

    // If logged in, fetch history and watched list, and save user message
    if (req.user) {
      const dbHistory = await ChatMessage.find({ userId: req.user.userId }).sort({ createdAt: 1 }).limit(16);
      recentHistory = dbHistory.map(m => ({ role: m.role, content: m.text }));
      
      const dbWatched = await WatchedItem.find({ userId: req.user.userId });
      watchedList = dbWatched.map(w => ({ title_name: w.title_name, title_type: w.title_type }));
      
      await new ChatMessage({ userId: req.user.userId, role: "user", text: message }).save();
    }

    const convText = recentHistory.length > 0
      ? "\n\nConversation so far:\n" +
        recentHistory.map(m => (m.role === "owl" ? "Owl" : "User") + ": " + m.content).join("\n")
      : "";

    const watchedCtx = watchedList.length > 0
      ? "\n\nUser's saved list: " + watchedList.map(w => w.title_name + " (" + w.title_type + ")").join(", ") + "."
      : "";

    const detailCtx = context
      ? `\n\n[Currently viewing: "${context.title}" (${context.type}), ${context.rating}/10. ${context.blurb}]`
      : "";

    const fullPrompt = SYSTEM_PROMPT + watchedCtx + convText + detailCtx + "\n\nUser: " + message + "\nOwl:";

    const reply = await callGemini(fullPrompt);

    if (req.user) {
      await new ChatMessage({ userId: req.user.userId, role: "owl", text: reply }).save();
    }
    
    res.json({ reply });

  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ error: "Owl could not respond.", detail: err.message });
  }
});

router.get("/history", authMiddleware, async (req, res) => {
  try {
    const dbHistory = await ChatMessage.find({ userId: req.user.userId }).sort({ createdAt: 1 }).limit(200);
    const history = dbHistory.map(m => ({ role: m.role, text: m.text }));
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

module.exports = router;
