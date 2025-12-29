const mongoose = require("mongoose");

const GoalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  savedAmount: { type: Number, default: 0 },
  deadline: { type: Date },
  priority: {
    type: String,
    enum: ["HIGH", "MEDIUM", "LOW"],
    default: "MEDIUM",
  },
  // Replaces "isReached" with more detailed status
  status: {
    type: String,
    enum: ["ACTIVE", "PAUSED", "COMPLETED"],
    default: "ACTIVE",
  },
  completedDate: { type: Date }, // Log when it happened
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Goal", GoalSchema);
