const fs = require("fs");
const csv = require("csv-parser");
const Transaction = require("../models/Transaction");

exports.processCsvUpload = (filePath, userId) => {
  const results = [];
  const errors = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        // 1. Basic Validation / Mapping
        // CSV Headers expected: type, category, amount, date, description
        if (!data.amount || !data.type) {
          errors.push({ row: data, msg: "Missing amount or type" });
        } else {
          results.push({
            userId,
            type: data.type.toUpperCase(), // Ensure case safety
            category: data.category || "Uncategorized",
            amount: parseFloat(data.amount),
            date: data.date ? new Date(data.date) : new Date(),
            description: data.description || "Bulk Import",
          });
        }
      })
      .on("end", async () => {
        try {
          // 2. Bulk Insert (Efficient)
          if (results.length > 0) {
            await Transaction.insertMany(results);
          }

          // 3. Cleanup file
          fs.unlinkSync(filePath);

          resolve({
            successCount: results.length,
            errorCount: errors.length,
            errors,
          });
        } catch (err) {
          reject(err);
        }
      })
      .on("error", (err) => reject(err));
  });
};
