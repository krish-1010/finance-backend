const Transaction = require("../models/Transaction");
const FinanceMath = require("../utils/financeMath");
const Asset = require("../models/Asset");
const Debt = require("../models/Debt");

/**
 * Service: Generates the Financial Health Dashboard
 */
exports.getDashboardData = async (userId) => {
  // 1. Fetch current month's data
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  const transactions = await Transaction.find({
    userId,
    date: { $gte: startOfMonth },
  });

  // 2. Aggregate Data
  let totalIncome = 0;
  let totalFixedExpenses = 0; // "Locked" expenses
  let totalVariableExpenses = 0;

  transactions.forEach((t) => {
    if (t.type === "INCOME") totalIncome += t.amount;
    if (t.type === "EXPENSE") {
      if (t.isLocked) totalFixedExpenses += t.amount;
      else totalVariableExpenses += t.amount;
    }
  });

  const totalSpent = totalFixedExpenses + totalVariableExpenses;
  const remaining = totalIncome - totalSpent;

  // 3. Apply Theory (The "Suggestion" Engine)
  const idealBudget = FinanceMath.calculateBudgetSplit(totalIncome);

  // Insight Logic
  const insights = [];

  if (totalSpent > totalIncome * 0.8) {
    insights.push({
      type: "WARNING",
      message: "High Burn Rate: You have spent over 80% of your income.",
      action: 'Check your "Wants" category.',
    });
  }

  if (totalFixedExpenses > idealBudget.needs) {
    insights.push({
      type: "ALERT",
      message: `Your fixed costs are ${(
        (totalFixedExpenses / totalIncome) *
        100
      ).toFixed(1)}% of income. Safe limit is 50%.`,
      action: "Consider cheaper rent or removing fixed subscriptions.",
    });
  }

  return {
    summary: {
      income: totalIncome,
      fixedExpenses: totalFixedExpenses,
      variableExpenses: totalVariableExpenses,
      balance: remaining,
    },
    benchmarks: {
      idealNeeds: idealBudget.needs,
      idealWants: idealBudget.wants,
      idealSavings: idealBudget.savings,
    },
    insights,
  };
};

/**
 * Service: Add Transaction (Logic wrapper)
 */
exports.addTransaction = async (userId, data) => {
  // If user locks an expense, ensure it's marked correctly
  if (data.isLocked && data.type !== "EXPENSE") {
    throw new Error("Only expenses can be locked.");
  }
  return await Transaction.create({ ...data, userId });
};
exports.getNetWorth = async (userId) => {
  // 1. Get all Assets
  const assets = await Asset.find({ userId });
  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);

  // 2. Get all Debts
  const debts = await Debt.find({ userId });
  const totalDebt = debts.reduce((sum, d) => sum + d.currentAmount, 0);

  // 3. Liquid Assets (Cash available now)
  const liquidAssets = assets
    .filter((a) => a.isLiquid)
    .reduce((sum, a) => sum + a.value, 0);

  return {
    totalAssets,
    totalDebt,
    netWorth: totalAssets - totalDebt,
    liquidAssets, // Important for "Runway" calculation
    breakdown: {
      assets,
      debts,
    },
  };
};
