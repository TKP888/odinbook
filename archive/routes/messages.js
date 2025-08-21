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

// Messages page
router.get("/", ensureAuthenticated, (req, res) => {
  res.render("messages/index", {
    title: "Messages",
    user: req.user,
    layout: "layouts/main",
    activePage: "messages",
  });
});

module.exports = router;
