const express = require("express");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const { PrismaClient } = require("@prisma/client");
const passport = require("passport");

const router = express.Router();
const prisma = new PrismaClient();

// Load passport config
require("../config/passport")(passport);

// Login Page
router.get("/auth/login", (req, res) => {
  res.render("auth/login", {
    title: "Login",
    layout: "layouts/auth",
    activePage: "login",
  });
});

// Register Page
router.get("/auth/register", (req, res) => {
  res.render("auth/register", {
    title: "Register",
    layout: "layouts/auth",
    activePage: "register",
  });
});

// Register Handle
router.post(
  "/auth/register",
  [
    body("firstName", "First name is required").notEmpty(),
    body("lastName", "Last name is required").notEmpty(),
    body("email", "Please include a valid email").isEmail(),
    body("username", "Username is required").notEmpty(),
    body("password", "Password must be 6 or more characters").isLength({
      min: 6,
    }),
    body("password2", "Passwords do not match").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.render("auth/register", {
        title: "Register",
        layout: "layouts/auth",
        activePage: "register",
        errors: errors.array(),
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        username: req.body.username,
      });
    }

    try {
      const { firstName, lastName, email, username, password } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: email }, { username: username }],
        },
      });

      if (existingUser) {
        req.flash("error_msg", "User already exists");
        return res.render("auth/register", {
          title: "Register",
          layout: "layouts/auth",
          activePage: "register",
          firstName,
          lastName,
          email,
          username,
        });
      }

      // Hash Password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new user
      const newUser = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          username,
          password: hashedPassword,
        },
      });

      req.flash("success_msg", "You are now registered and can log in");
      res.redirect("/auth/login");
    } catch (err) {
      console.error(err);
      req.flash("error_msg", "Error creating user");
      res.redirect("/auth/register");
    }
  }
);

// Login Handle
router.post("/auth/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/auth/login",
    failureFlash: true,
  })(req, res, next);
});

// Logout Handle
router.get("/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return res.redirect("/dashboard");
    }
    req.flash("success_msg", "You are logged out");
    res.redirect("/auth/login");
  });
});

module.exports = router;
