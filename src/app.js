require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const morgan = require("morgan"); // Logger
const cors = require("cors");
const MongoStore = require("connect-mongo").default;

// Import Configs
require("./config/passport"); // Loads passport strategy

// Import Routes
const authRoutes = require("./routes/authRoutes");
const financeRoutes = require("./routes/financeRoutes");

// Define allowed origins based on environment
const allowedOrigins = [
  "http://localhost:3000", // Local Frontend
  "https://growmorefinance.vercel.app", // Production Frontend
];

const app = express();
app.set("trust proxy", 1);

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
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        var msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// 3. Session & Passport (Required for Auth)
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    // cookie: {
    //   // secure: process.env.NODE_ENV === "production", // Set 'true' only if using HTTPS
    //   secure: true,
    //   // sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    //   sameSite: "none",
    //   httpOnly: true,
    //   maxAge: 24 * 60 * 60 * 1000, // 1 Day
    // },
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
      // MUST be false for localhost, true for Render
      secure: process.env.NODE_ENV === "production",

      // MUST be "lax" for localhost to work reliably
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",

      maxAge: 24 * 60 * 60 * 1000,
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
