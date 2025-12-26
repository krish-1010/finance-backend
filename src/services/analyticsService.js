const Transaction = require("../models/Transaction");

exports.getMonthlyBreakdown = async (userId) => {
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  return await Transaction.aggregate([
    {
      $match: {
        userId: userId,
        type: "EXPENSE",
        date: { $gte: startOfMonth },
      },
    },
    {
      $group: {
        _id: "$category",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } }, // Highest expense first
  ]);
};
