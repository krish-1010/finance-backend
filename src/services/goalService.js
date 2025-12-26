const Goal = require("../models/Goal");
const Transaction = require("../models/Transaction");

exports.getFIREStatus = async (userId) => {
  // 1. Calculate Average Monthly Expense (Last 3 Months)
  // (Complex aggregation simplified for MVP)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const expenses = await Transaction.aggregate([
    {
      $match: {
        userId: userId,
        type: "EXPENSE",
        date: { $gte: threeMonthsAgo },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const avgMonthlyExpense = expenses.length
    ? Math.round(expenses[0].total / 3)
    : 0;
  const annualExpense = avgMonthlyExpense * 12;

  // 2. FIRE Logic (25x Rule)
  const fireNumber = annualExpense * 25;

  // 3. Current Liquid Assets (Goals + Savings)
  // Assuming "Goal" money is saved money.
  const goals = await Goal.find({ userId });
  const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0);

  return {
    metrics: {
      averageMonthlySpend: avgMonthlyExpense,
      fireTarget: fireNumber,
      currentNetWorth: totalSaved,
      progress:
        fireNumber > 0 ? ((totalSaved / fireNumber) * 100).toFixed(2) : 0,
    },
    goals: goals,
  };
};

exports.createGoal = async (userId, data) => {
  return await Goal.create({ ...data, userId });
};
