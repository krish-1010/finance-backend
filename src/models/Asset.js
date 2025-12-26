const mongoose = require("mongoose");

const AssetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true }, // e.g., "HDFC Savings", "Zerodha Portfolio", "Mom's Gold"
  type: {
    type: String,
    enum: ["CASH", "INVESTMENT", "REAL_ESTATE", "GOLD", "EPF", "OTHER"],
    required: true,
  },
  value: { type: Number, required: true }, // Current market value
  isLiquid: { type: Boolean, default: false }, // Can I spend this today? (Cash/Savings = Yes, House/EPF = No)
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Asset", AssetSchema);
