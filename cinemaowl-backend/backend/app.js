require("dotenv").config();
const express = require("express");
const cors = require("cors");

const titlesRouter = require("./routes/titles");
const chatRouter   = require("./routes/chat");
const savedRouter  = require("./routes/saved");
const watchedRouter = require("./routes/watched");

const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = [
      /^http:\/\/localhost(:\d+)?$/,
      /^https?:\/\/.*\.vercel\.app$/,
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    const ok = allowed.some((p) =>
      typeof p === "string" ? origin === p : p.test(origin)
    );
    if (ok) return callback(null, true);
    callback(new Error("CORS: origin not allowed — " + origin));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, service: "CinemaOwl API" }));

app.use("/api/titles",  titlesRouter);
app.use("/api/chat",    chatRouter);
app.use("/api/saved",   savedRouter);
app.use("/api/watched", watchedRouter);

module.exports = app;
