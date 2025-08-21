#!/usr/bin/env node

/**
 * Cleanup Script for OdinBook
 * Helps maintain the organized project structure
 */

const fs = require("fs");
const path = require("path");

console.log("🧹 OdinBook Cleanup Script");
console.log("==========================\n");

// Check for files that should be moved to appropriate directories
const rootFiles = fs.readdirSync(".");
const issues = [];

// Check for test files in root
const testFilesInRoot = rootFiles.filter(
  (file) =>
    file.startsWith("test-") || (file.includes("test") && file.endsWith(".js"))
);

if (testFilesInRoot.length > 0) {
  issues.push({
    type: "Test files in root directory",
    files: testFilesInRoot,
    suggestion: "Move to tests/ directory",
  });
}

// Check for utility scripts in root
const scriptFilesInRoot = rootFiles.filter(
  (file) =>
    file.includes("fix-") ||
    file.includes("transfer-") ||
    file.includes("check-") ||
    file.includes("mark-") ||
    file.includes("quick-")
);

if (scriptFilesInRoot.length > 0) {
  issues.push({
    type: "Utility scripts in root directory",
    files: scriptFilesInRoot,
    suggestion: "Move to appropriate scripts/ subdirectory",
  });
}

// Check for database files in root
const dbFilesInRoot = rootFiles.filter(
  (file) => file.endsWith(".sql") || file === "railway.toml"
);

if (dbFilesInRoot.length > 0) {
  issues.push({
    type: "Database files in root directory",
    files: dbFilesInRoot,
    suggestion: "Move to database/ directory",
  });
}

// Check for old monolithic files in root
const oldFilesInRoot = rootFiles.filter(
  (file) =>
    file === "app.js" ||
    file === "autoAcceptJobs.js" ||
    file === "routes" ||
    file === "config"
);

if (oldFilesInRoot.length > 0) {
  issues.push({
    type: "Old monolithic files in root directory",
    files: oldFilesInRoot,
    suggestion: "Move to archive/ directory",
  });
}

// Report issues
if (issues.length === 0) {
  console.log("✅ Project structure is clean! No issues found.");
} else {
  console.log("⚠️  Found some organizational issues:\n");

  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.type}:`);
    issue.files.forEach((file) => {
      console.log(`   - ${file}`);
    });
    console.log(`   💡 Suggestion: ${issue.suggestion}\n`);
  });

  console.log("🔧 To fix these issues, run the reorganize script:");
  console.log("   npm run reorganize");
}

// Check directory structure
console.log("\n📁 Current Directory Structure:");
console.log("================================");

const directories = [
  "src",
  "tests",
  "scripts",
  "database",
  "archive",
  "public",
  "views",
  "prisma",
];

directories.forEach((dir) => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).length;
    console.log(`✅ ${dir}/ (${files} files)`);
  } else {
    console.log(`❌ ${dir}/ (missing)`);
  }
});

// Check for unnecessary files
console.log("\n🧹 Cleanup Recommendations:");
console.log("============================");

const unnecessaryFiles = [
  ".DS_Store",
  "Thumbs.db",
  "*.log",
  "node_modules/.cache",
  "coverage/",
  ".nyc_output/",
];

unnecessaryFiles.forEach((pattern) => {
  console.log(`   - Remove ${pattern}`);
});

console.log("\n📚 For more information:");
console.log("   - Check PROJECT_STRUCTURE.md for the ideal structure");
console.log('   - Run "npm run status" to check project health');
console.log('   - Run "npm run reorganize" to fix structure issues');
