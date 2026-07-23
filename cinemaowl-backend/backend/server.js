require("dotenv").config();
const express = require("express");
const cors = require("cors");

const titlesRouter = require("./routes/titles");
const chatRouter = require("./routes/chat");
const savedRouter = require("./routes/saved");
const watchedRouter = require("./routes/watched");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, service: "CinemaOwl API" }));

app.use("/api/titles", titlesRouter);
app.use("/api/chat", chatRouter);
app.use("/api/saved", savedRouter);
app.use("/api/watched", watchedRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🦉 CinemaOwl backend running on http://localhost:${PORT}`);
});
