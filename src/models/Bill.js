const mongoose = require("mongoose");

const BillSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true }, // e.g., "Netflix"
    amount: { type: Number, required: true }, // 199
    dueDay: { type: Number, required: true }, // e.g., 5 (5th of month)
    category: { type: String, default: "Bills" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bill", BillSchema);
