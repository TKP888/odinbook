const { body, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
  }
  next();
};

const validatePost = [
  body("content")
    .trim()
    .custom((value, { req }) => {
      // Require either content (min 1 char) OR an image
      if (!value && !req.file) {
        throw new Error(
          "Post content must be at least 1 character or include a photo"
        );
      }
      if (value && value.length > 1000) {
        throw new Error("Post content must be less than 1000 characters");
      }
      return true;
    }),
  handleValidationErrors,
];

// Special validation for updates that allows empty content if post has existing image
const validatePostUpdate = [
  body("content")
    .trim()
    .custom(async (value, { req }) => {
      // For updates, allow empty content if:
      // 1. New file is uploaded, OR
      // 2. Existing post has an image
      if (!value && !req.file) {
        // Check if existing post has an image
        try {
          const postService = require("../services/postService");
          const existingPost = await postService.getPostById(req.params.id);
          if (!existingPost || !existingPost.photoUrl) {
            throw new Error(
              "Post content must be at least 1 character or include a photo"
            );
          }
        } catch (error) {
          console.error("Error checking existing post:", error);
          throw new Error(
            "Post content must be at least 1 character or include a photo"
          );
        }
      }
      if (value && value.length > 1000) {
        throw new Error("Post content must be less than 1000 characters");
      }
      return true;
    }),
  handleValidationErrors,
];

const validateComment = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Comment must be between 1 and 500 characters"),
  handleValidationErrors,
];

const validateProfile = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("First name must be between 1 and 50 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Last name must be between 1 and 50 characters"),
  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio must be less than 500 characters"),
  handleValidationErrors,
];

const validateRegistration = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage(
      "Username must be 3-30 characters, alphanumeric and underscores only"
    ),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Password confirmation does not match password");
    }
    return true;
  }),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validatePost,
  validatePostUpdate,
  validateComment,
  validateProfile,
  validateRegistration,
};
