# CinemaOwl Backend

Real Express + SQLite backend: fetches live movie/show data from TMDB, anime data from
Jikan (MyAnimeList, no key needed), runs the Owl AI agent via the Anthropic API, and
persists all chat + saved-title data to a local SQLite database.

## Setup

```bash
cd backend
npm install
cp .env.example .env
# then edit .env and add your real TMDB_API_KEY and ANTHROPIC_API_KEY
npm run dev
```

Server runs at `http://localhost:4000`.

## Endpoints

- `GET  /api/titles/:kind/:rail` — kind = movie|show, rail = trending|latest|upcoming
- `GET  /api/titles/anime/:rail` — rail = trending|latest|upcoming (Jikan)
- `GET  /api/titles/detail/:kind/:id` — full detail incl. cast + production
- `GET  /api/titles/search?q=...&kind=movie|show|anime`
- `POST /api/chat` — body `{ sessionId, message, context? }` → Owl's reply, auto-saved to DB
- `GET  /api/chat/:sessionId` — full saved chat history for a session
- `POST /api/saved` / `DELETE /api/saved` / `GET /api/saved/:sessionId` — watchlist

## Wiring up the frontend

In `CinemaOwl.jsx`, replace the mock `askOwl()` function's body with a `fetch` call to
`POST http://localhost:4000/api/chat`, and replace the `TITLES` mock array with data
loaded from `GET /api/titles/...` on mount. Everything else (UI, routing, animations)
stays the same.
