const express = require("express");
const router = express.Router();
const financeController = require("../controllers/financeController");
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Temp storage

// Middleware to check if user is logged in
const ensureAuth = (req, res, next) => {
  // DEV BYPASS: If we are in dev mode and no user is logged in,
  // we mock a user so we can test in Postman without a Frontend.
  // if (process.env.NODE_ENV === "development" && !req.user) {
  //   req.user = { id: "60d5ecb8b487343568912345" }; // specific dummy ID
  //   return next();
  // }

  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};

// Routes
router.post("/transactions", ensureAuth, financeController.addEntry);
router.get("/dashboard", ensureAuth, financeController.getDashboard);
// New Route for CSV
router.post(
  "/upload",
  ensureAuth,
  upload.single("file"),
  financeController.uploadCsv
);
// Debt Routes
router.post("/debts", ensureAuth, financeController.addDebt);
router.get("/debts/strategy", ensureAuth, financeController.getDebtStrategy);
// Add this route
router.delete("/debts/:id", ensureAuth, financeController.deleteDebt);
// Add this new route
router.patch(
  "/debts/:id/status",
  ensureAuth,
  financeController.toggleDebtStatus
);
// Goal Routes
router.post("/goals", ensureAuth, financeController.addGoal);
router.get("/fire", ensureAuth, financeController.getFIREAnalysis);

// Analytics Routes
router.get("/analytics", ensureAuth, financeController.getAnalytics);

// Asset & Net Worth Routes
router.post("/assets", ensureAuth, financeController.addAsset);
router.get("/networth", ensureAuth, financeController.getNetWorthReport);

router.get("/advisor", ensureAuth, financeController.getAdvice);

router.get("/transactions", ensureAuth, financeController.getTransactions);
router.delete(
  "/transactions/:id",
  ensureAuth,
  financeController.deleteTransaction
);
// Add these routes
router.get("/bills", ensureAuth, financeController.getBills);
router.post("/bills", ensureAuth, financeController.addBill);
router.post(
  "/transactions/bulk",
  ensureAuth,
  financeController.processBulkBills
);

router.put("/goals/:id/add", ensureAuth, financeController.addFundsToGoal);
router.put("/goals/:id/status", ensureAuth, financeController.toggleGoalStatus);
router.delete("/goals/:id", ensureAuth, financeController.deleteGoal);

router.get("/goals", ensureAuth, financeController.getGoals);

// Add these lines
router.get("/survival", ensureAuth, financeController.getConsumptionItems);
router.post("/survival", ensureAuth, financeController.addConsumptionItem);
router.delete(
  "/survival/:id",
  ensureAuth,
  financeController.deleteConsumptionItem
);

// Add this route
router.delete("/reset", ensureAuth, financeController.resetAccount);

module.exports = router;
