#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔍 Checking OdinBook Project Status...\n");

const checks = [
  {
    name: "Source Directory Structure",
    path: "src",
    required: true,
  },
  {
    name: "Main Application File",
    path: "src/app.js",
    required: true,
  },
  {
    name: "Middleware Directory",
    path: "src/middleware",
    required: true,
  },
  {
    name: "Services Directory",
    path: "src/services",
    required: true,
  },
  {
    name: "Routes Directory",
    path: "src/routes",
    required: true,
  },
  {
    name: "Utils Directory",
    path: "src/utils",
    required: true,
  },
  {
    name: "Config Directory",
    path: "src/config",
    required: true,
  },
  {
    name: "Tests Directory",
    path: "tests",
    required: true,
  },
  {
    name: "Scripts Directory",
    path: "scripts",
    required: true,
  },
  {
    name: "Database Directory",
    path: "database",
    required: true,
  },
  {
    name: "Archive Directory",
    path: "archive",
    required: true,
  },
  {
    name: "Public Assets",
    path: "public",
    required: true,
  },
  {
    name: "Views Directory",
    path: "views",
    required: true,
  },
  {
    name: "Package.json",
    path: "package.json",
    required: true,
  },
  {
    name: "Environment File",
    path: ".env",
    required: false,
  },
];

let allChecksPassed = true;
let totalChecks = 0;
let passedChecks = 0;

checks.forEach((check) => {
  totalChecks++;
  const exists = fs.existsSync(check.path);
  const status = exists ? "✅" : check.required ? "❌" : "⚠️";
  const message = exists
    ? "Found"
    : check.required
    ? "Missing (Required)"
    : "Missing (Optional)";

  console.log(`${status} ${check.name}: ${message}`);

  if (exists) {
    passedChecks++;
  } else if (check.required) {
    allChecksPassed = false;
  }
});

console.log("\n📊 Summary:");
console.log(`   Total Checks: ${totalChecks}`);
console.log(`   Passed: ${passedChecks}`);
console.log(`   Failed: ${totalChecks - passedChecks}`);

if (allChecksPassed) {
  console.log(
    "\n🎉 All required checks passed! Your project is properly organized."
  );
  console.log("\n🚀 To start the application:");
  console.log("   npm start          # Production mode");
  console.log("   npm run dev        # Development mode with hot reload");
  console.log("   ./start.sh         # Using the startup script");
  
  console.log("\n🧪 To run tests:");
  console.log("   npm test           # Run all tests");
  console.log("   npm run test:all   # Run all tests with detailed output");
  console.log("   npm run test:user  # Run user tests only");
  
  console.log("\n🔧 Maintenance:");
  console.log("   npm run clean      # Check project structure");
  console.log("   npm run status     # Check project health");
} else {
  console.log(
    "\n❌ Some required checks failed. Please review the issues above."
  );
}

// Check file sizes to show the improvement
console.log("\n📏 File Size Analysis:");
const oldPostsRoute = "archive/routes/posts.js";
const newPostsRoute = "src/routes/posts.js";

if (fs.existsSync(oldPostsRoute) && fs.existsSync(newPostsRoute)) {
  const oldSize = fs.statSync(oldPostsRoute).size;
  const newSize = fs.statSync(newPostsRoute).size;
  const reduction = (((oldSize - newSize) / oldSize) * 100).toFixed(1);

  console.log(`   Old posts.js: ${(oldSize / 1024).toFixed(1)} KB`);
  console.log(`   New posts.js: ${(newSize / 1024).toFixed(1)} KB`);
  console.log(`   Reduction: ${reduction}%`);
}

// Check organization quality
console.log("\n🏗️ Organization Quality:");
const rootFiles = fs.readdirSync(".").filter(file => 
  !file.startsWith(".") && 
  !file.includes("node_modules") &&
  !file.includes("package")
);

const organizedFiles = rootFiles.filter(file => 
  fs.statSync(file).isDirectory() || 
  file.endsWith(".md") ||
  file.endsWith(".sh") ||
  file.endsWith(".js") && file.includes("check") || file.includes("start")
);

const organizationScore = (organizedFiles.length / rootFiles.length * 100).toFixed(1);
console.log(`   Root directory organization: ${organizationScore}%`);

if (organizationScore >= 80) {
  console.log("   🎉 Excellent organization!");
} else if (organizationScore >= 60) {
  console.log("   👍 Good organization");
} else {
  console.log("   ⚠️  Could be better organized");
}

console.log("\n📚 For more information:");
console.log("   - PROJECT_STRUCTURE.md - Complete project structure guide");
console.log("   - REORGANIZATION_COMPLETE.md - What was accomplished");
console.log("   - README.md - Project overview and setup");
