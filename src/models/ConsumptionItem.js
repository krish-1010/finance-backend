const mongoose = require("mongoose");

const ConsumptionItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true }, // "Stationery"
    cost: { type: Number, required: true }, // 100
    months: { type: Number, required: true }, // 4 (Lasts 4 months)
    monthlyCost: { type: Number }, // Auto-calculated (25)
  },
  { timestamps: true }
);

// Pre-save hook to calculate monthly cost automatically
ConsumptionItemSchema.pre("save", function (next) {
  if (this.cost && this.months) {
    this.monthlyCost = this.cost / this.months;
  }
  next();
});

module.exports = mongoose.model("ConsumptionItem", ConsumptionItemSchema);
