const mongoose = require("mongoose");

const WatchedItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title_id: { type: String, required: true },
  title_type: { type: String, required: true },
  title_name: { type: String, required: true },
  poster_url: { type: String },
  tmdb_id: { type: String },
  addedAt: { type: Date, default: Date.now },
});

// Compound index so a user can't add the same title twice
WatchedItemSchema.index({ userId: 1, title_id: 1 }, { unique: true });

module.exports = mongoose.model("WatchedItem", WatchedItemSchema);
