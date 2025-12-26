const express = require("express");
const passport = require("passport");
const router = express.Router();

// 1. Redirect to Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 2. Google calls this back
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    console.log("Authenticated user:", req.user);
    console.log(`${frontendUrl}/dashboard`);
    res.redirect(`${frontendUrl}/dashboard`);
  }
);

// 3. Logout Route
router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    // Explicitly destroy the session in the database/memory
    req.session.destroy((err) => {
      if (err) console.log("Session destroy error:", err);

      // Clear the cookie from the browser
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });
});

module.exports = router;
