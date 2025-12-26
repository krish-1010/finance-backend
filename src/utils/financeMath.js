/**
 * Core Financial Formulas
 */

// 1. The 50/30/20 Rule Calculator
exports.calculateBudgetSplit = (totalIncome) => {
  return {
    needs: totalIncome * 0.5, // 50%
    wants: totalIncome * 0.3, // 30%
    savings: totalIncome * 0.2, // 20%
  };
};

// 2. Emergency Fund Calculator (Risk Adjusted)
exports.calculateEmergencyFundTarget = (
  monthlyFixedExpenses,
  monthlyVariableAvg,
  riskFactor = 6
) => {
  // riskFactor: 6 months is standard, 12 for freelancers
  const monthlyBurn = monthlyFixedExpenses + monthlyVariableAvg;
  return monthlyBurn * riskFactor;
};

// 3. FIRE Number (Financial Independence)
exports.calculateFIRENumber = (annualExpenses) => {
  // Standard rule: 25x annual expenses (4% withdrawal rate)
  return annualExpenses * 25;
};

// 4. Debt Payoff Priority (Avalanche Method Logic)
exports.sortDebtsByAvalanche = (debts) => {
  // Sort by highest interest rate first
  return debts.sort((a, b) => b.interestRate - a.interestRate);
};

// 5. Debt Payoff Calculator (Updated for 0% Interest)
exports.calculateDebtPayoff = (totalDebt, interestRate, monthlyPayment) => {
  if (monthlyPayment <= 0) return "Infinity";

  // Scenario A: Soft Loan (0% Interest)
  if (!interestRate || interestRate === 0) {
    const months = totalDebt / monthlyPayment;
    return Math.ceil(months);
  }

  // Scenario B: Bank Loan (Compound Interest)
  const monthlyRate = interestRate / 100 / 12;

  // Math check: If interest > payment, you will never pay it off
  if (totalDebt * monthlyRate >= monthlyPayment) {
    return "Never (Payment too low)";
  }

  // Nper Formula: -log(1 - (r * PV) / PMT) / log(1 + r)
  const numerator = Math.log(1 - (monthlyRate * totalDebt) / monthlyPayment);
  const denominator = Math.log(1 + monthlyRate);

  return Math.ceil(-(numerator / denominator));
};

// 6. Inflation Adjusted Target
exports.calculateFutureValue = (
  currentExpenses,
  years,
  inflationRate = 0.07
) => {
  // Formula: FV = PV * (1 + r)^n
  return currentExpenses * Math.pow(1 + inflationRate, years);
};

// 7. Sinking Fund Monthly Contribution
exports.calculateSinkingFund = (targetAmount, monthsUntilDue) => {
  if (monthsUntilDue <= 0) return targetAmount;
  return Math.ceil(targetAmount / monthsUntilDue);
};
