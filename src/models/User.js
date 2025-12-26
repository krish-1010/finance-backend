const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  displayName: String,
  preferences: {
    currency: { type: String, default: "INR" },
    // User's manual trigger for month start (e.g., 1st or 25th)
    salaryDate: { type: Number, default: 1 },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
