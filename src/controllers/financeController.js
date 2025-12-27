const financeService = require("../services/financeService");
const Joi = require("joi");
const importService = require("../services/importService");
const debtService = require("../services/debtService");
const goalService = require("../services/goalService");
const analyticsService = require("../services/analyticsService");
const Asset = require("../models/Asset");
const advisorService = require("../services/advisorService");
const Transaction = require("../models/Transaction");
const Bill = require("../models/Bill");
const Goal = require("../models/Goal");
const ConsumptionItem = require("../models/ConsumptionItem");

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

// Add this function
exports.deleteDebt = async (req, res) => {
  try {
    await debtService.deleteDebt(req.user.id, req.params.id);
    res.json({ message: "Debt deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Toggle Debt Status (Active <-> Paid Off)
exports.toggleDebtStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const debt = await require("../models/Debt").findOne({ _id: id, userId: req.user.id });
    
    if (!debt) return res.status(404).json({ error: "Debt not found" });

    // Toggle logic
    debt.status = debt.status === "ACTIVE" ? "PAID_OFF" : "ACTIVE";
    debt.currentAmount = 0; // If paid off, balance is 0
    
    await debt.save();
    res.json(debt);
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

// Wipe all data for the user
exports.resetAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    // Delete everything linked to this user
    await Promise.all([
      Transaction.deleteMany({ userId }),
      require("../models/Debt").deleteMany({ userId }), // Assuming you have Debt model
      require("../models/Asset").deleteMany({ userId }), // Assuming you have Asset model
    ]);
    res.json({ message: "Account reset successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- RECURRING BILLS ---

// 1. Get all recurring bill templates
exports.getBills = async (req, res) => {
  try {
    const bills = await Bill.find({ userId: req.user.id }).sort({ dueDay: 1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Add a new recurring bill
exports.addBill = async (req, res) => {
  try {
    const bill = await Bill.create({ ...req.body, userId: req.user.id });
    res.status(201).json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Process Bulk Bills (The "One Click" Feature)
exports.processBulkBills = async (req, res) => {
  try {
    const { bills } = req.body; // Array of selected bill objects

    // Create transaction objects from the bills
    const transactions = bills.map((bill) => ({
      userId: req.user.id,
      type: "EXPENSE",
      amount: bill.amount,
      category: bill.category || "Bills",
      description: `${bill.name} (Recurring)`,
      date: new Date(), // Today's date
    }));

    // Insert all at once
    await Transaction.insertMany(transactions);

    res.json({
      message: `Successfully processed ${transactions.length} bills.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ADD THIS FUNCTION:
exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- SURVIVAL / AMORTIZATION ---
exports.getConsumptionItems = async (req, res) => {
  try {
    const items = await ConsumptionItem.find({ userId: req.user.id });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addConsumptionItem = async (req, res) => {
  try {
    const item = await ConsumptionItem.create({
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteConsumptionItem = async (req, res) => {
  try {
    await ConsumptionItem.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
