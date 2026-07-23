const express = require("express");
const axios = require("axios");
const router = express.Router();

const TMDB_BASE = "https://api.themoviedb.org/3";
const JIKAN_BASE = "https://api.jikan.moe/v4";

function tmdb(pathname, params = {}) {
  return axios.get(`${TMDB_BASE}${pathname}`, {
    params: { api_key: process.env.TMDB_API_KEY, ...params },
  });
}

// ── IMPORTANT: specific routes must come BEFORE /:kind/:rail ──────────────────

// GET /api/titles/genres/:kind — genre list
router.get("/genres/:kind", async (req, res) => {
  const { kind } = req.params;
  if (kind === "anime") return res.json({ genres: [] });
  const media = kind === "show" ? "tv" : "movie";
  try {
    const { data } = await tmdb(`/genre/${media}/list`);
    res.json({ genres: data.genres });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "failed to fetch genres" });
  }
});

// GET /api/titles/genre/:kind/:genreId — discover by genre
router.get("/genre/:kind/:genreId", async (req, res) => {
  const { kind, genreId } = req.params;
  if (kind === "anime") return res.json({ results: [] });
  const media = kind === "show" ? "tv" : "movie";
  try {
    const { data } = await tmdb(`/discover/${media}`, {
      with_genres: genreId,
      sort_by: "popularity.desc",
      page: req.query.page || 1,
    });
    const results = data.results.map((r) => ({
      id: `${media}-${r.id}`,
      tmdbId: r.id,
      type: kind,
      title: r.title || r.name,
      year: (r.release_date || r.first_air_date || "").slice(0, 4),
      rating: r.vote_average ? Number(r.vote_average.toFixed(1)) : 0,
      poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
      blurb: r.overview,
    }));
    res.json({ results, total_pages: data.total_pages, page: data.page });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "failed to fetch by genre" });
  }
});

// GET /api/titles/search?q=...&kind=movie|show|anime
router.get("/search", async (req, res) => {
  const { q, kind } = req.query;
  if (!q) return res.json({ results: [] });
  try {
    if (kind === "anime") {
      const { data } = await axios.get(`${JIKAN_BASE}/anime`, { params: { q, limit: 15 } });
      return res.json({
        results: data.data.map((a) => ({
          id: `anime-${a.mal_id}`, type: "anime", title: a.title,
          year: a.year, rating: a.score || 0,
          poster: a.images?.jpg?.large_image_url,
          blurb: a.synopsis,
        })),
      });
    }
    const media = kind === "show" ? "tv" : "movie";
    const { data } = await tmdb(`/search/${media}`, { query: q });
    res.json({
      results: data.results.map((r) => ({
        id: `${media}-${r.id}`, type: kind, title: r.title || r.name,
        year: (r.release_date || r.first_air_date || "").slice(0, 4),
        rating: r.vote_average ? Number(r.vote_average.toFixed(1)) : 0,
        poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
        blurb: r.overview,
      })),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "search failed" });
  }
});

// GET /api/titles/detail/:kind/:id — full detail with all TMDB fields
router.get("/detail/:kind/:id", async (req, res) => {
  const { kind, id } = req.params;
  try {
    if (kind === "anime") {
      const { data } = await axios.get(`${JIKAN_BASE}/anime/${id}/full`);
      const a = data.data;
      return res.json({
        title: a.title, year: a.year, rating: a.score,
        blurb: a.synopsis,
        production: a.studios?.map((s) => s.name).join(", "),
        genres: a.genres?.map((g) => g.name),
        genreIds: a.genres?.map((g) => ({ id: String(g.mal_id), name: g.name })),
        poster: a.images?.jpg?.large_image_url,
        status: a.status, episodes: a.episodes, duration: a.duration,
        season: a.season, rank: a.rank, type: "anime",
        aired: a.aired?.string,
        source: a.source,
        rating_pg: a.rating,
      });
    }

    const media = kind === "show" ? "tv" : "movie";
    const [detail, credits] = await Promise.all([
      tmdb(`/${media}/${id}`),
      tmdb(`/${media}/${id}/credits`),
    ]);
    const d = detail.data;

    const base = {
      title: d.title || d.name,
      year: (d.release_date || d.first_air_date || "").slice(0, 4),
      rating: d.vote_average ? Number(d.vote_average.toFixed(1)) : 0,
      voteCount: d.vote_count,
      blurb: d.overview,
      tagline: d.tagline || null,
      status: d.status,
      originalLanguage: d.original_language,
      production: d.production_companies?.map((c) => c.name).join(", "),
      genres: d.genres?.map((g) => g.name),
      genreIds: d.genres?.map((g) => ({ id: String(g.id), name: g.name })),
      cast: credits.data.cast?.slice(0, 12).map((c) => ({
        name: c.name, character: c.character,
        profile: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
      })),
      director: credits.data.crew?.find((c) => c.job === "Director")?.name || null,
      poster: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null,
      backdrop: d.backdrop_path ? `https://image.tmdb.org/t/p/w1280${d.backdrop_path}` : null,
      type: kind,
    };

    if (media === "movie") {
      base.runtime = d.runtime;
      base.budget = d.budget;
      base.revenue = d.revenue;
      base.releaseDate = d.release_date;
      base.collection = d.belongs_to_collection?.name || null;
    } else {
      base.seasons = d.number_of_seasons;
      base.episodes = d.number_of_episodes;
      base.networks = d.networks?.map((n) => n.name);
      base.episodeRuntime = d.episode_run_time?.[0];
      base.lastAirDate = d.last_air_date;
      base.nextEpisode = d.next_episode_to_air ? {
        date: d.next_episode_to_air.air_date,
        name: d.next_episode_to_air.name,
        episode: d.next_episode_to_air.episode_number,
        season: d.next_episode_to_air.season_number,
      } : null;
      base.creators = d.created_by?.map((c) => c.name) || [];
    }

    res.json(base);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "failed to fetch detail" });
  }
});

// GET /api/titles/anime/:rail
router.get("/anime/:rail", async (req, res) => {
  const { rail } = req.params;
  try {
    let params = {};
    if (rail === "trending") params = { filter: "airing" };
    else if (rail === "upcoming") params = { filter: "upcoming" };
    else params = { filter: "bypopularity" };

    const { data } = await axios.get(`${JIKAN_BASE}/top/anime`, { params });
    const results = data.data.slice(0, 20).map((a) => ({
      id: `anime-${a.mal_id}`, malId: a.mal_id, type: "anime",
      title: a.title, year: a.year || "",
      rating: a.score || 0,
      poster: a.images?.jpg?.large_image_url || null,
      blurb: a.synopsis,
    }));
    res.json({ results });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "failed to fetch from Jikan" });
  }
});

// GET /api/titles/:kind/:rail — MUST be last (catch-all param route)
router.get("/:kind/:rail", async (req, res) => {
  const { kind, rail } = req.params;
  const media = kind === "show" ? "tv" : "movie";
  try {
    let url;
    if (rail === "trending") url = `/trending/${media}/week`;
    else if (rail === "latest") url = media === "tv" ? "/tv/on_the_air" : "/movie/now_playing";
    else if (rail === "upcoming") url = media === "tv" ? "/tv/airing_today" : "/movie/upcoming";
    else return res.status(400).json({ error: "invalid rail" });

    const { data } = await tmdb(url);
    const results = data.results.map((r) => ({
      id: `${media}-${r.id}`, tmdbId: r.id, type: kind,
      title: r.title || r.name,
      year: (r.release_date || r.first_air_date || "").slice(0, 4),
      rating: r.vote_average ? Number(r.vote_average.toFixed(1)) : 0,
      poster: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
      blurb: r.overview,
    }));
    res.json({ results });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "failed to fetch from TMDB" });
  }
});

module.exports = router;
