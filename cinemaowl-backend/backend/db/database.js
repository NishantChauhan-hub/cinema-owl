/**
 * database.js — Pure JSON-file persistence.
 * Zero native dependencies, works on any machine with Node.js.
 * Data is stored in db/cinemaowl.json next to this file.
 */

const fs   = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "cinemaowl.json");

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function load() {
  if (!fs.existsSync(DB_PATH)) return fresh();
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch {
    return fresh();
  }
}

function fresh() {
  return {
    sessions:       {},          // { [sessionId]: true }
    messages:       [],          // { id, session_id, role, content, context_title_id, created_at }
    saved_titles:   [],          // { session_id, title_id, title_type, created_at }
    watched_titles: [],          // { session_id, title_id, title_type, title_name, poster_url, tmdb_id, added_at }
  };
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

function now() {
  return new Date().toISOString();
}

/* ── Session ──────────────────────────────────────────────────────────────── */

function ensureSession(sessionId) {
  const db = load();
  if (!db.sessions[sessionId]) {
    db.sessions[sessionId] = true;
    save(db);
  }
}

/* ── Messages ─────────────────────────────────────────────────────────────── */

function saveMessage(sessionId, role, content, contextTitleId = null) {
  ensureSession(sessionId);
  const db = load();
  db.messages.push({
    id:               db.messages.length + 1,
    session_id:       sessionId,
    role,
    content,
    context_title_id: contextTitleId,
    created_at:       now(),
  });
  save(db);
}

function getHistory(sessionId, limit = 30) {
  const db = load();
  return db.messages
    .filter(m => m.session_id === sessionId)
    .slice(-limit)
    .map(m => ({ role: m.role, content: m.content, created_at: m.created_at }));
}

/* ── Saved Titles ─────────────────────────────────────────────────────────── */

function saveTitle(sessionId, titleId, titleType) {
  ensureSession(sessionId);
  const db = load();
  const exists = db.saved_titles.some(
    s => s.session_id === sessionId && s.title_id === titleId
  );
  if (!exists) {
    db.saved_titles.push({ session_id: sessionId, title_id: titleId, title_type: titleType, created_at: now() });
    save(db);
  }
}

function unsaveTitle(sessionId, titleId) {
  const db = load();
  db.saved_titles = db.saved_titles.filter(
    s => !(s.session_id === sessionId && s.title_id === titleId)
  );
  save(db);
}

function getSavedTitles(sessionId) {
  const db = load();
  return db.saved_titles
    .filter(s => s.session_id === sessionId)
    .map(s => ({ title_id: s.title_id, title_type: s.title_type }));
}

/* ── Watched Titles ───────────────────────────────────────────────────────── */

function addWatched(sessionId, titleId, titleType, titleName, posterUrl, tmdbId) {
  ensureSession(sessionId);
  const db = load();
  // Remove existing entry first (upsert behaviour)
  db.watched_titles = db.watched_titles.filter(
    w => !(w.session_id === sessionId && w.title_id === titleId)
  );
  db.watched_titles.push({
    session_id: sessionId,
    title_id:   titleId,
    title_type: titleType,
    title_name: titleName,
    poster_url: posterUrl || null,
    tmdb_id:    tmdbId    || null,
    added_at:   now(),
  });
  save(db);
}

function removeWatched(sessionId, titleId) {
  const db = load();
  db.watched_titles = db.watched_titles.filter(
    w => !(w.session_id === sessionId && w.title_id === titleId)
  );
  save(db);
}

function getWatched(sessionId) {
  const db = load();
  return db.watched_titles
    .filter(w => w.session_id === sessionId)
    .sort((a, b) => b.added_at.localeCompare(a.added_at));
}

function isWatched(sessionId, titleId) {
  const db = load();
  return db.watched_titles.some(
    w => w.session_id === sessionId && w.title_id === titleId
  );
}

/* ── Exports ──────────────────────────────────────────────────────────────── */

module.exports = {
  ensureSession,
  saveMessage,
  getHistory,
  saveTitle,
  unsaveTitle,
  getSavedTitles,
  addWatched,
  removeWatched,
  getWatched,
  isWatched,
};
