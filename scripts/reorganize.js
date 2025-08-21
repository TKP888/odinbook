#!/usr/bin/env node

/**
 * Migration script to reorganize the OdinBook codebase
 * This script helps move files from the old structure to the new organized structure
 */

const fs = require("fs");
const path = require("path");

console.log("🚀 Starting OdinBook codebase reorganization...\n");

// Create new directory structure
const directories = [
  "src",
  "src/middleware",
  "src/services",
  "src/routes",
  "src/utils",
  "src/public/js/modules",
  "scripts",
];

directories.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Move and reorganize files
const fileMoves = [
  {
    from: "app.js",
    to: "src/app.js",
    description: "Main application file",
  },
  {
    from: "routes/posts.js",
    to: "src/routes/posts.js",
    description: "Posts routes (reorganized)",
  },
  {
    from: "routes/friends.js",
    to: "src/routes/friends.js",
    description: "Friends routes (reorganized)",
  },
  {
    from: "routes/auth.js",
    to: "src/routes/auth.js",
    description: "Authentication routes",
  },
  {
    from: "routes/dashboard.js",
    to: "src/routes/dashboard.js",
    description: "Dashboard routes",
  },
  {
    from: "routes/profile.js",
    to: "src/routes/profile.js",
    description: "Profile routes",
  },
  {
    from: "routes/messages.js",
    to: "src/routes/messages.js",
    description: "Message routes",
  },
  {
    from: "config/passport.js",
    to: "src/config/passport.js",
    description: "Passport configuration",
  },
  {
    from: "config/cloudinary.js",
    to: "src/config/cloudinary.js",
    description: "Cloudinary configuration",
  },
  {
    from: "autoAcceptJobs.js",
    to: "src/autoAcceptJobs.js",
    description: "Auto-accept jobs system",
  },
];

console.log("\n📁 Moving files to new structure...\n");

fileMoves.forEach((move) => {
  if (fs.existsSync(move.from)) {
    // Create destination directory if it doesn't exist
    const destDir = path.dirname(move.to);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Copy file to new location
    fs.copyFileSync(move.from, move.to);
    console.log(`✅ Moved: ${move.from} → ${move.to}`);
    console.log(`   ${move.description}`);
  } else {
    console.log(`⚠️  File not found: ${move.from}`);
  }
});

// Create new organized files
const newFiles = [
  {
    path: "src/middleware/auth.js",
    content: `const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error_msg", "Please log in to view this resource");
  res.redirect("/auth/login");
};

const ensureGuest = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect("/dashboard");
};

const ensureOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id || req.params.postId || req.params.commentId;
      const userId = req.user.id;
      
      let resource;
      
      switch (resourceType) {
        case 'post':
          resource = await req.prisma.post.findUnique({
            where: { id: resourceId },
            select: { userId: true }
          });
          break;
        case 'comment':
          resource = await req.prisma.comment.findUnique({
            where: { id: resourceId },
            select: { userId: true }
          });
          break;
        case 'profile':
          resource = { userId: resourceId };
          break;
        default:
          return res.status(400).json({ error: 'Invalid resource type' });
      }
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      if (resource.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
};

module.exports = {
  ensureAuthenticated,
  ensureGuest,
  ensureOwnership
};`,
  },
  {
    path: "src/middleware/validation.js",
    content: `const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

const validatePost = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Post content must be between 1 and 1000 characters'),
  handleValidationErrors
];

const validateComment = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters'),
  handleValidationErrors
];

const validateProfile = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  handleValidationErrors
];

const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters, alphanumeric and underscores only'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validatePost,
  validateComment,
  validateProfile,
  validateRegistration
};`,
  },
];

console.log("\n📝 Creating new organized files...\n");

newFiles.forEach((file) => {
  if (!fs.existsSync(file.path)) {
    // Create destination directory if it doesn't exist
    const destDir = path.dirname(file.path);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    fs.writeFileSync(file.path, file.content);
    console.log(`✅ Created: ${file.path}`);
  } else {
    console.log(`⚠️  File already exists: ${file.path}`);
  }
});

// Update package.json scripts
console.log("\n📦 Updating package.json...\n");

if (fs.existsSync("package.json")) {
  try {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

    // Update main entry point
    packageJson.main = "src/app.js";

    // Update scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      start: "node --no-deprecation src/app.js",
      dev: "nodemon --no-deprecation src/app.js",
      build: "npm run lint && npm run test",
      lint: "eslint src/",
      test: "jest",
      reorganize: "node scripts/reorganize.js",
    };

    // Add new dependencies
    if (!packageJson.devDependencies) {
      packageJson.devDependencies = {};
    }

    packageJson.devDependencies.eslint = "^8.0.0";
    packageJson.devDependencies.jest = "^29.0.0";

    // Update description
    packageJson.description =
      "A social media clone built with Node.js, Express, EJS, and PostgreSQL - Reorganized for better maintainability";
    packageJson.version = "2.0.0";

    fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));
    console.log("✅ Updated package.json with new scripts and dependencies");
  } catch (error) {
    console.error("❌ Error updating package.json:", error.message);
  }
}

// Create .gitignore for new structure
const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Build outputs
dist/
build/

# Temporary files
tmp/
temp/`;

if (!fs.existsSync(".gitignore")) {
  fs.writeFileSync(".gitignore", gitignoreContent);
  console.log("✅ Created .gitignore file");
}

console.log("\n🎉 Reorganization complete!");
console.log("\n📋 Next steps:");
console.log("1. Install new dependencies: npm install");
console.log("2. Test the application: npm run dev");
console.log("3. Review the new structure in the src/ directory");
console.log("4. Update any remaining import paths in your code");
console.log("5. Consider moving more business logic to services");
console.log(
  "\n📚 Check the README.md for detailed information about the new architecture."
);
