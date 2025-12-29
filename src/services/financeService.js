const Transaction = require("../models/Transaction");
const FinanceMath = require("../utils/financeMath");
const Asset = require("../models/Asset");
const Debt = require("../models/Debt");

/**
 * Service: Generates the Financial Health Dashboard
 */
exports.getDashboardData = async (userId) => {
  console.log("------------------------------------------------");
  console.log("🕵️‍♂️ STARTING X-RAY DEBUG FOR USER:", userId);

  // 1. Fetch ALL transactions
  const allTransactions = await Transaction.find({ userId }).sort({ date: 1 });
  console.log(`✅ Loaded ${allTransactions.length} transactions.`);

  // 2. Calculate Totals Separately (The X-Ray)
  let totalIncome = 0;
  let totalExpense = 0;

  allTransactions.forEach((t) => {
    // Ensure amount is a Number
    const val = Number(t.amount);

    if (t.type === "INCOME") {
      totalIncome += val;
    } else if (t.type === "EXPENSE" || t.type === "DEBT_PAYMENT") {
      totalExpense += val;
    }
  });

  const balance = totalIncome - totalExpense;

  // --- PRINT THE TRUTH TO THE CONSOLE ---
  console.log(`📈 TOTAL INCOME FOUND:  ₹${totalIncome.toFixed(2)}`);
  console.log(`📉 TOTAL EXPENSE FOUND: ₹${totalExpense.toFixed(2)}`);
  console.log(`🧮 FINAL BALANCE:       ₹${balance.toFixed(2)}`);
  console.log("------------------------------------------------");

  // 3. Monthly Stats & History (Standard Logic)
  const monthlyData = {};
  const currentMonthKey = new Date().toISOString().slice(0, 7);

  allTransactions.forEach((t) => {
    const d = new Date(t.date);
    if (isNaN(d.getTime())) return;
    const monthKey = d.toISOString().slice(0, 7);

    if (!monthlyData[monthKey])
      monthlyData[monthKey] = { name: monthKey, income: 0, expense: 0 };

    if (t.type === "INCOME") monthlyData[monthKey].income += t.amount;
    else if (t.type === "EXPENSE") monthlyData[monthKey].expense += t.amount;
  });

  const history = Object.values(monthlyData).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const currentMonthStats = monthlyData[currentMonthKey] || {
    income: 0,
    expense: 0,
  };

  // 4. Fixed vs Variable (Current Month)
  const startOfCurrentMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  let fixedExpenses = 0;
  let variableExpenses = 0;

  allTransactions
    .filter(
      (t) => new Date(t.date) >= startOfCurrentMonth && t.type === "EXPENSE"
    )
    .forEach((t) => {
      if (t.isLocked) fixedExpenses += t.amount;
      else variableExpenses += t.amount;
    });

  // 5. Recent Transactions
  const recentTransactions = [...allTransactions].reverse().slice(0, 5);

  return {
    summary: {
      income: currentMonthStats.income,
      fixedExpenses,
      variableExpenses,
      balance: balance, // Use the X-Ray balance
    },
    history,
    recentTransactions,
    insights: [],
    benchmarks: {},
  };
};

// ... Exports ...
exports.addTransaction = async (userId, data) => {
  if (data.isLocked && data.type !== "EXPENSE")
    throw new Error("Only expenses can be locked.");
  return await Transaction.create({ ...data, userId });
};

exports.getNetWorth = async (userId) => {
  const assets = await Asset.find({ userId });
  const debts = await Debt.find({ userId });
  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const totalDebt = debts.reduce((sum, d) => sum + d.currentAmount, 0);
  const liquidAssets = assets
    .filter((a) => a.isLiquid)
    .reduce((sum, a) => sum + a.value, 0);

  return {
    totalAssets,
    totalDebt,
    netWorth: totalAssets - totalDebt,
    liquidAssets,
    breakdown: { assets, debts },
  };
};
