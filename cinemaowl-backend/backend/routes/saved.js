const express = require("express");
const { saveTitle, unsaveTitle, getSavedTitles } = require("../db/database");
const router = express.Router();

router.get("/:sessionId", (req, res) => {
  res.json({ saved: getSavedTitles(req.params.sessionId) });
});

router.post("/", (req, res) => {
  const { sessionId, titleId, titleType } = req.body;
  if (!sessionId || !titleId) return res.status(400).json({ error: "sessionId and titleId required" });
  saveTitle(sessionId, titleId, titleType || "movie");
  res.json({ ok: true });
});

router.delete("/", (req, res) => {
  const { sessionId, titleId } = req.body;
  unsaveTitle(sessionId, titleId);
  res.json({ ok: true });
});

module.exports = router;
