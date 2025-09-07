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
  // Ensure no user data is passed to the registration form
  res.render("auth/register", {
    title: "Register",
    layout: "layouts/auth",
    activePage: "register",
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    birthday: "",
    gender: "",
    location: "",
    errors: [],
    // Explicitly set user to null to prevent any session data inheritance
    user: null,
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
    body("password", "Password must be 6 or more characters")
      .isLength({ min: 6 })
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/
      )
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    body("password2", "Passwords do not match").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    }),
    body("birthday")
      .notEmpty()
      .withMessage("Birthday is required")
      .custom((value) => {
        const date = new Date(value);
        const today = new Date();

        // Check if it's a valid date
        if (isNaN(date.getTime())) {
          throw new Error("Please enter a valid date");
        }

        // Check if date is in the future
        if (date > today) {
          throw new Error("Birthday cannot be in the future");
        }

        // Check if user is at least 16 years old
        const age = today.getFullYear() - date.getFullYear();
        const monthDiff = today.getMonth() - date.getMonth();

        let actualAge = age;
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < date.getDate())
        ) {
          actualAge = age - 1;
        }

        if (actualAge < 16) {
          throw new Error("You must be at least 16 years old to register");
        }

        return true;
      }),
    body("gender").optional().isLength({ max: 50 }),
    body("location").optional().isLength({ max: 100 }),
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
        birthday: req.body.birthday || "",
        gender: req.body.gender || "",
        location: req.body.location || "",
      });
    }

    try {
      const {
        firstName,
        lastName,
        email,
        username,
        password,
        birthday,
        gender,
        location,
      } = req.body;

      // Check if email already exists
      const existingEmail = await prisma.user.findUnique({
        where: { email: email },
      });

      if (existingEmail) {
        return res.render("auth/register", {
          title: "Register",
          layout: "layouts/auth",
          activePage: "register",
          errors: [{ msg: "An account with this email already exists" }],
          firstName,
          lastName,
          email,
          username,
          birthday: birthday || "",
          gender: gender || "",
          location: location || "",
        });
      }

      // Check if username already exists
      const existingUsername = await prisma.user.findUnique({
        where: { username: username },
      });

      if (existingUsername) {
        return res.render("auth/register", {
          title: "Register",
          layout: "layouts/auth",
          activePage: "register",
          errors: [
            {
              msg: "This username is already taken. Please choose another one.",
            },
          ],
          firstName,
          lastName,
          email,
          username,
          birthday: birthday || "",
          gender: gender || "",
          location: location || "",
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
          birthday: birthday && birthday !== "" ? new Date(birthday) : null,
          gender: gender || null,
          location: location || null,
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

// Guest Login Handle
router.post("/auth/guest-login", (req, res, next) => {
  // Use passport authentication with guest credentials
  req.body.email = "guest@odinbook.com";
  req.body.password = "qwerty";

  passport.authenticate("local", async (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash("error_msg", info.message);
      return res.redirect("/auth/login");
    }

    // Log in the user
    req.logIn(user, async (err) => {
      if (err) {
        return next(err);
      }

      // Ensure guest user has useGravatar set to false
      if (user.email === "guest@odinbook.com" && user.useGravatar) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { useGravatar: false },
          });
          // Update the user object in the request
          req.user.useGravatar = false;
        } catch (error) {
          console.error("Error updating guest user settings:", error);
        }
      }

      res.redirect("/dashboard");
    });
  })(req, res, next);
});

// Check username availability
router.get("/auth/check-username/:username", async (req, res) => {
  try {
    const { username } = req.params;

    // Basic validation
    if (!username || username.length < 3 || username.length > 30) {
      return res.json({
        available: false,
        message: "Username must be 3-30 characters",
      });
    }

    // Check for valid characters (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.json({
        available: false,
        message: "Username can only contain letters, numbers, and underscores",
      });
    }

    // Check if username exists in database
    const existingUser = await prisma.user.findUnique({
      where: { username: username },
    });

    if (existingUser) {
      return res.json({
        available: false,
        message: "Username is not available",
      });
    }

    return res.json({
      available: true,
      message: "Username is available",
    });
  } catch (error) {
    console.error("Error checking username:", error);
    return res.status(500).json({
      available: false,
      message: "Error checking username availability",
    });
  }
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
