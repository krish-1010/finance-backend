const mongoose = require("mongoose");

const DebtSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true }, // e.g., "HDFC Credit Card"
  totalAmount: { type: Number, required: true }, // Original Principal
  currentAmount: { type: Number, required: true }, // Remaining Balance
  interestRate: { type: Number, default: 0 }, // 0 for "Backlog/Soft Loan"
  minimumPayment: { type: Number, default: 0 },
  dueDate: { type: Number }, // Day of month (e.g., 5th)
  status: { type: String, enum: ["ACTIVE", "PAID_OFF"], default: "ACTIVE" },
});

module.exports = mongoose.model("Debt", DebtSchema);
