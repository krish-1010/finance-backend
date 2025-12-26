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
    // Successful authentication, redirect to frontend dashboard
    // For now, we just send a JSON success message
    // res.json({ message: "Login Successful", user: req.user });
    // res.redirect("http://localhost:3000/dashboard");
    res.redirect("https://growmorefinance.vercel.app/dashboard");
  }
);

// 3. Logout
// router.get("/logout", (req, res, next) => {
//   req.logout((err) => {
//     if (err) {
//       return next(err);
//     }
//     res.json({ message: "Logged out" });
//   });
// });

// Updated the Logout Route
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
