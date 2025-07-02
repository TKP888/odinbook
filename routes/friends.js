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

// Friends page
router.get("/", ensureAuthenticated, (req, res) => {
  res.render("friends/index", {
    title: "Friends",
    user: req.user,
    layout: "layouts/main",
    activePage: "friends",
  });
});

module.exports = router;
