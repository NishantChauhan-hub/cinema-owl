import { API, PLACEHOLDER_GRADIENTS } from "../constants";

// ── Session ID ────────────────────────────────────────────────────────────────
// A unique ID stored in localStorage so each browser session has its own list.
export const SESSION_ID = (() => {
  let id = localStorage.getItem("owl_session");
  if (!id) {
    id = "owl_" + Math.random().toString(36).slice(2, 11);
    localStorage.setItem("owl_session", id);
  }
  return id;
})();

// ── API helper ────────────────────────────────────────────────────────────────
// Wraps fetch with error handling. Returns null on any failure.
export async function apiFetch(path, opts = {}) {
  try {
    const res = await fetch(`${API}${path}`, opts);
    if (!res.ok) {
      try {
        const errBody = await res.json();
        return errBody || { error: `HTTP Error: ${res.status}` };
      } catch {
        return { error: `HTTP Error: ${res.status}` };
      }
    }
    return res.json();
  } catch (err) {
    return { error: err.message };
  }
}

// ── Poster placeholder ────────────────────────────────────────────────────────
// Deterministically picks a gradient color based on the title/id string.
export function hashGrad(str = "") {
  let h = 0;
  for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return PLACEHOLDER_GRADIENTS[Math.abs(h) % PLACEHOLDER_GRADIENTS.length];
}

// ── Formatters ────────────────────────────────────────────────────────────────
export function fmtMoney(n) {
  if (!n || n === 0) return null;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

export function fmtRuntime(mins) {
  if (!mins) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
