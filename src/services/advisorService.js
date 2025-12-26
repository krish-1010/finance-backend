const FinanceMath = require("../utils/financeMath");
const Transaction = require("../models/Transaction");
const Asset = require("../models/Asset");
const Debt = require("../models/Debt");

exports.getInvestmentAdvice = async (userId) => {
  // 1. Fetch User Financial Snapshot
  // (Assuming we have helper functions to get these totals)
  const debts = await Debt.find({ userId });
  const assets = await Asset.find({ userId });

  // Calculate Totals
  const totalHighInterestDebt = debts
    .filter((d) => d.interestRate > 10) // Credit Cards, Personal Loans
    .reduce((sum, d) => sum + d.currentAmount, 0);

  const liquidCash = assets
    .filter((a) => a.isLiquid) // Savings Acc, Cash
    .reduce((sum, a) => sum + a.value, 0);

  // 2. Define Safety Thresholds
  // Hardcoded for MVP, but should be dynamic based on user expense
  const monthlyExpenses = 20000; // Example: fetch from real average
  const requiredEmergencyFund = monthlyExpenses * 6;

  // 3. The Waterfall Logic (The "Brain")
  const steps = [];

  // STEP 1: Kill Toxic Debt
  if (totalHighInterestDebt > 0) {
    return {
      status: "CRITICAL",
      message: "Stop investing! You have high-interest debt.",
      action: `Pay off ₹${totalHighInterestDebt} in loans first. Return on paying debt (12-24%) is guaranteed.`,
      allocation: { debt: 100, equity: 0, gold: 0 },
    };
  }

  // STEP 2: Secure the Foundation (Emergency Fund)
  if (liquidCash < requiredEmergencyFund) {
    const deficit = requiredEmergencyFund - liquidCash;
    return {
      status: "WARNING",
      message: "Build your safety net.",
      action: `You need ₹${deficit} more in Liquid Funds (FD/Savings). Do not lock money in Stocks yet.`,
      allocation: { debt: 100, equity: 0, gold: 0 }, // 100% into liquid assets
    };
  }

  // STEP 3: Wealth Creation (The "Room to Invest")
  // If we reach here, the user is safe. Now we suggest based on Time Horizon.
  // We return a "Standard Aggressive Portfolio" for young Indians.
  return {
    status: "HEALTHY",
    message: "You are ready to build wealth!",
    action: "Start a monthly SIP. Since you are young, focus on Equity.",
    suggestedPortfolio: [
      {
        type: "Index Mutual Funds (Nifty 50)",
        percentage: 60,
        reason: "Highest growth potential (avg 12%) for long term (>7 yrs).",
      },
      {
        type: "Mid-Cap/Flexi-Cap Funds",
        percentage: 20,
        reason: "Higher risk, higher reward. Good for aggressive growth.",
      },
      {
        type: "Gold (SGB/ETF)",
        percentage: 10,
        reason: "Hedge against inflation and market crashes.",
      },
      {
        type: "Debt/Bonds",
        percentage: 10,
        reason: "Stability for short-term goals.",
      },
    ],
  };
};
