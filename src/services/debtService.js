const Debt = require("../models/Debt");
const FinanceMath = require("../utils/financeMath"); // Reusing your math file

exports.getDebtStrategy = async (userId, extraMonthlyPayment = 0) => {
  const debts = await Debt.find({ userId, status: "ACTIVE" });

  // 1. Sort by "Avalanche Method" (Highest Interest First)
  // If interest is same, sort by lowest balance (Snowball hybrid)
  const sortedDebts = debts.sort((a, b) => {
    if (b.interestRate === a.interestRate)
      return a.currentAmount - b.currentAmount;
    return b.interestRate - a.interestRate;
  });

  // 2. Calculate Payoff Timeline
  const strategy = sortedDebts.map((debt) => {
    const monthsToPay = FinanceMath.calculateDebtPayoff(
      debt.currentAmount,
      debt.interestRate,
      debt.minimumPayment + extraMonthlyPayment // Apply "Snowball" money to top priority
    );

    // Reset extraPayment for lower priority debts (simplification)
    // In a real snowball, once Debt 1 is paid, its payment rolls into Debt 2.
    // For MVP, we just show the timeline for the specific debt.

    return {
      debtName: debt.name,
      remaining: debt.currentAmount,
      interest: debt.interestRate,
      monthsToFree: monthsToPay,
      priorityLevel: debt.interestRate > 10 ? "CRITICAL" : "MANAGEABLE",
    };
  });

  return {
    totalDebt: debts.reduce((sum, d) => sum + d.currentAmount, 0),
    strategyReport: strategy,
  };
};

exports.addDebt = async (userId, data) => {
  return await Debt.create({ ...data, userId });
};
