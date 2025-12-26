const financeService = require("../services/financeService");
const Joi = require("joi");
const importService = require("../services/importService");
const debtService = require("../services/debtService");
const goalService = require("../services/goalService");
const analyticsService = require("../services/analyticsService");
const Asset = require("../models/Asset");
const advisorService = require("../services/advisorService");
const Transaction = require("../models/Transaction");

// Schema for Input Validation
const transactionSchema = Joi.object({
  type: Joi.string().valid("INCOME", "EXPENSE", "DEBT_PAYMENT").required(),
  category: Joi.string().required(),
  amount: Joi.number().positive().required(),
  description: Joi.string().allow(""),
  isRecurring: Joi.boolean(),
  isLocked: Joi.boolean(),
  date: Joi.date(),
});

exports.addEntry = async (req, res) => {
  try {
    // 1. Validate Input
    const { error, value } = transactionSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // 2. Call Service
    const entry = await financeService.addTransaction(req.user.id, value);

    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const data = await financeService.getDashboardData(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.uploadCsv = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const report = await importService.processCsvUpload(
      req.file.path,
      req.user.id
    );
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- DEBT ---
exports.addDebt = async (req, res) => {
  try {
    const debt = await debtService.addDebt(req.user.id, req.body);
    res.status(201).json(debt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDebtStrategy = async (req, res) => {
  try {
    // User can simulate: "What if I pay an extra 5000?"
    const extra = req.query.extra ? parseFloat(req.query.extra) : 0;
    const strategy = await debtService.getDebtStrategy(req.user.id, extra);
    res.json(strategy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- GOALS / FIRE ---
exports.addGoal = async (req, res) => {
  try {
    const goal = await goalService.createGoal(req.user.id, req.body);
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFIREAnalysis = async (req, res) => {
  try {
    const data = await goalService.getFIREStatus(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- ANALYTICS ---
exports.getAnalytics = async (req, res) => {
  try {
    const data = await analyticsService.getMonthlyBreakdown(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addAsset = async (req, res) => {
  try {
    const asset = await Asset.create({ ...req.body, userId: req.user.id });
    res.status(201).json(asset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNetWorthReport = async (req, res) => {
  try {
    const report = await financeService.getNetWorth(req.user.id);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAdvice = async (req, res) => {
  try {
    const advice = await advisorService.getInvestmentAdvice(req.user.id);
    res.json(advice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get raw list of transactions (with pagination logic optional for later)
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id })
      .sort({ date: -1 }) // Newest first
      .limit(50); // Limit to last 50 for now (Scalability)

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Transaction.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!result)
      return res.status(404).json({ error: "Transaction not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
