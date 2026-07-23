// Local development server — not used by Vercel
const app = require("./app");

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🦉 CinemaOwl backend running on http://localhost:${PORT}`);
});
