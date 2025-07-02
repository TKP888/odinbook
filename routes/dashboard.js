const express = require("express");
const router = express.Router();

// Middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error_msg", "Please log in to view this resource");
  res.redirect("/auth/login");
}

// Dashboard page
router.get("/", ensureAuthenticated, (req, res) => {
  res.render("dashboard/index", {
    title: "Dashboard",
    user: req.user,
    layout: "layouts/main",
    activePage: "dashboard",
  });
});

module.exports = router;
