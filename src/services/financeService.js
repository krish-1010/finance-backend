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

  // 2. Fetch DATA
  // Query A: This Month (For Budget/Spending Charts)
  const monthlyTransactions = await Transaction.find({
    userId,
    date: { $gte: startOfMonth },
  });

  // Query B: ALL TIME (For Liquid Cash / Wallet Balance)
  const allTransactions = await Transaction.find({
    userId,
  });

  // 3. Calculate "Liquid Cash" (Lifetime Balance)
  let totalWalletBalance = 0;
  allTransactions.forEach((t) => {
    if (t.type === "INCOME") totalWalletBalance += t.amount;
    if (t.type === "EXPENSE" || t.type === "DEBT_PAYMENT")
      totalWalletBalance -= t.amount;
  });

  // 4. Calculate "Monthly Stats" (For Charts)
  let monthlyIncome = 0;
  let monthlyFixed = 0;
  let monthlyVariable = 0;

  monthlyTransactions.forEach((t) => {
    if (t.type === "INCOME") monthlyIncome += t.amount;
    if (t.type === "EXPENSE") {
      if (t.isLocked) monthlyFixed += t.amount;
      else monthlyVariable += t.amount;
    }
  });

  const monthlySpent = monthlyFixed + monthlyVariable;

  // 5. Apply Theory (The "Suggestion" Engine)
  // We use monthly stats for advice, because budgets are usually monthly.
  const idealBudget = FinanceMath.calculateBudgetSplit(monthlyIncome);
  const insights = [];

  if (monthlySpent > monthlyIncome * 0.8 && monthlyIncome > 0) {
    insights.push({
      type: "WARNING",
      message:
        "High Burn Rate: You have spent over 80% of your income this month.",
      action: 'Check your "Wants" category.',
    });
  }

  return {
    summary: {
      income: monthlyIncome,
      fixedExpenses: monthlyFixed,
      variableExpenses: monthlyVariable,
      // FIX: Return the TOTAL wallet balance, not just this month's savings
      balance: totalWalletBalance,
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
  if (data.isLocked && data.type !== "EXPENSE") {
    throw new Error("Only expenses can be locked.");
  }
  return await Transaction.create({ ...data, userId });
};

exports.getNetWorth = async (userId) => {
  const assets = await Asset.find({ userId });
  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);

  const debts = await Debt.find({ userId });
  const totalDebt = debts.reduce((sum, d) => sum + d.currentAmount, 0);

  const liquidAssets = assets
    .filter((a) => a.isLiquid)
    .reduce((sum, a) => sum + a.value, 0);

  return {
    totalAssets,
    totalDebt,
    netWorth: totalAssets - totalDebt,
    liquidAssets,
    breakdown: {
      assets,
      debts,
    },
  };
};
