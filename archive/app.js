const express = require("express");
const session = require("express-session");
const passport = require("passport");
const flash = require("express-flash");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();
const expressLayouts = require("express-ejs-layouts");

// Initialize auto-accept system for seed users
const { getPendingJobs } = require("./autoAcceptJobs");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main"); // Set default layout

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Flash messages
app.use(flash());

// Global variables for flash messages
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.user = req.user || null;

  // Gravatar helper function
  res.locals.getGravatarUrl = function (email, size = 200) {
    if (!email) return null;
    const hash = crypto
      .createHash("md5")
      .update(email.toLowerCase().trim())
      .digest("hex");
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=pg`;
  };

  next();
});

// Routes
app.use("/", require("./routes/auth"));
app.use("/dashboard", require("./routes/dashboard"));
app.use("/profile", require("./routes/profile"));
app.use("/friends", require("./routes/friends"));
app.use("/messages", require("./routes/messages"));
app.use("/posts", require("./routes/posts"));

// Home route
app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/dashboard");
  } else {
    res.redirect("/auth/login");
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error", {
    title: "Error",
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render("error", {
    title: "Page Not Found",
    message: "Page not found",
    error: {},
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log("🤖 Auto-accept system for seed users is active");
  console.log(
    `📊 Current pending auto-accept jobs: ${getPendingJobs().length}`
  );
});
