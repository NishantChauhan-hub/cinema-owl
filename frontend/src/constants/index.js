import { Clapperboard, Tv, Ghost, TrendingUp, Sparkles, CalendarClock } from "lucide-react";

export const API = import.meta.env.VITE_API_URL || "/api";
export const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

export const TABS = [
  { id: "movie", label: "Movies", icon: Clapperboard },
  { id: "show",  label: "Shows",  icon: Tv },
  { id: "anime", label: "Anime",  icon: Ghost },
];

export const RAILS = [
  { id: "trending", label: "Trending Now", icon: TrendingUp,   accent: "#FF006E" },
  { id: "latest",   label: "Fresh Drops",  icon: Sparkles,     accent: "#00D4FF" },
  { id: "upcoming", label: "Coming Soon",  icon: CalendarClock, accent: "#7C3AED" },
];

export const GENRE_RAILS = {
  movie: [
    { id: 28,  name: "Action",   accent: "#FF4500", emoji: "💥" },
    { id: 27,  name: "Horror",   accent: "#9333EA", emoji: "👻" },
    { id: 35,  name: "Comedy",   accent: "#EAB308", emoji: "😂" },
    { id: 878, name: "Sci-Fi",   accent: "#00D4FF", emoji: "🚀" },
    { id: 18,  name: "Drama",    accent: "#C084FC", emoji: "🎭" },
    { id: 53,  name: "Thriller", accent: "#FF6B35", emoji: "🔪" },
  ],
  show: [
    { id: 10759, name: "Action & Adventure", accent: "#FF4500", emoji: "⚔️" },
    { id: 35,    name: "Comedy",             accent: "#EAB308", emoji: "😂" },
    { id: 18,    name: "Drama",              accent: "#C084FC", emoji: "🎭" },
    { id: 10765, name: "Sci-Fi & Fantasy",   accent: "#00D4FF", emoji: "🚀" },
    { id: 9648,  name: "Mystery",            accent: "#8C6BFF", emoji: "🔍" },
    { id: 80,    name: "Crime",              accent: "#FF6B35", emoji: "🕵️" },
  ],
  anime: [],
};

export const ALL_FOOTER_GENRES = [
  { id: 28,    name: "Action"    },
  { id: 12,    name: "Adventure" },
  { id: 16,    name: "Animation" },
  { id: 35,    name: "Comedy"    },
  { id: 80,    name: "Crime"     },
  { id: 18,    name: "Drama"     },
  { id: 14,    name: "Fantasy"   },
  { id: 27,    name: "Horror"    },
  { id: 9648,  name: "Mystery"   },
  { id: 10749, name: "Romance"   },
  { id: 878,   name: "Sci-Fi"    },
  { id: 53,    name: "Thriller"  },
  { id: 10752, name: "War"       },
  { id: 37,    name: "Western"   },
];

export const PLACEHOLDER_GRADIENTS = [
  "linear-gradient(135deg,#7C3AED 0%,#FF006E 100%)",
  "linear-gradient(135deg,#00D4FF 0%,#7C3AED 100%)",
  "linear-gradient(135deg,#FF006E 0%,#FF8C00 100%)",
  "linear-gradient(135deg,#1a0533 0%,#00D4FF 100%)",
  "linear-gradient(135deg,#00D4FF 0%,#FF006E 100%)",
  "linear-gradient(135deg,#0F2027 0%,#7C3AED 100%)",
];
