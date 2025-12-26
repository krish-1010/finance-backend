require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const morgan = require("morgan"); // Logger
const cors = require("cors");

// Import Configs
require("./config/passport"); // Loads passport strategy

// Import Routes
const authRoutes = require("./routes/authRoutes");
const financeRoutes = require("./routes/financeRoutes");

const app = express();
app.set('trust proxy', 1);

// 1. Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// 2. Middlewares
app.use(express.json()); // Allow JSON in request body
// app.use(cors()); // Allow Frontend to talk to Backend
// app.use(
//   cors({
//     origin: "http://localhost:3000", // Explicitly trust the Next.js frontend
//     credentials: true, // Allow cookies/session headers to pass through
//   })
// );
app.use(morgan("dev")); // Logging
// Must be BEFORE routes
app.use(
  cors({
    origin: ["http://localhost:3000", "https://growmorefinance.vercel.app"], // Allow Frontend
    credentials: true, // Allow Cookies/Sessions
  })
);

// 3. Session & Passport (Required for Auth)
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set 'true' only if using HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 1 Day
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRoutes);

app.use("/api", financeRoutes);

// Base Route
app.get("/", (req, res) => {
  res.send("Finance GPS API is Running 🚀");
});

// 5. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
