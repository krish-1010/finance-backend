const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["INCOME", "EXPENSE", "DEBT_PAYMENT"],
    required: true,
  },
  category: {
    type: String,
    required: true,
    // Examples: 'Salary', 'Rent', 'Groceries', 'CreditCard'
  },
  amount: { type: Number, required: true },
  description: { type: String, default: "" },

  // The "Modern Web Twist" Features
  isRecurring: { type: Boolean, default: false }, // For Subscriptions
  isLocked: { type: Boolean, default: false }, // Essential/Fixed expenses (Rent)
  recurrenceInterval: {
    type: String,
    enum: ["NONE", "MONTHLY", "YEARLY"],
    default: "NONE",
  },

  // For Debt Tracking
  debtTotalAmount: { type: Number }, // Only if type is DEBT_PAYMENT (tracking total remaining)
  interestRate: { type: Number }, // Annual interest rate for debts

  date: { type: Date, default: Date.now },
});

// Index for fast querying by user and date
TransactionSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("Transaction", TransactionSchema);
