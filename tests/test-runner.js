#!/usr/bin/env node

/**
 * Comprehensive Test Runner for OdinBook
 * Executes all test suites and provides detailed reporting
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🧪 OdinBook Comprehensive Test Suite");
console.log("====================================\n");

// Test suites configuration
const testSuites = [
  {
    name: "Authentication Tests",
    file: "auth.test.js",
    description: "Login, register, logout, guest login, username validation",
  },
  {
    name: "User Management Tests",
    file: "user.test.js",
    description: "Profile updates, bio management, profile pictures",
  },
  {
    name: "Friend System Tests",
    file: "friends.test.js",
    description: "Friend requests, friendships, user search",
  },
  {
    name: "Post Management Tests",
    file: "posts.test.js",
    description: "Create, update, delete posts, likes, comments",
  },
  {
    name: "Profile Page Tests",
    file: "profile.test.js",
    description: "Profile viewing, post visibility, Gravatar integration",
  },
  {
    name: "Dashboard Tests",
    file: "dashboard.test.js",
    description: "Post feed, friend visibility, pagination",
  },
  {
    name: "Service Layer Tests",
    file: "services.test.js",
    description: "Business logic testing for all services",
  },
  {
    name: "Integration Tests",
    file: "integration.test.js",
    description: "End-to-end workflow testing",
  },
];

const testDir = __dirname;
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];

console.log("📋 Test Suites to Run:\n");
testSuites.forEach((suite, index) => {
  console.log(`${index + 1}. ${suite.name}`);
  console.log(`   📄 ${suite.file}`);
  console.log(`   📝 ${suite.description}\n`);
});

console.log("🚀 Starting Test Execution\n");
console.log("=".repeat(50));

// Run each test suite
testSuites.forEach((suite, index) => {
  console.log(`\n[${index + 1}/${testSuites.length}] Running ${suite.name}...`);
  console.log(`📄 File: ${suite.file}`);

  const testPath = path.join(testDir, suite.file);

  // Check if test file exists
  if (!fs.existsSync(testPath)) {
    console.log(`⚠️  Test file not found: ${suite.file}`);
    results.push({
      suite: suite.name,
      file: suite.file,
      status: "SKIPPED",
      reason: "File not found",
    });
    return;
  }

  try {
    const startTime = Date.now();
    execSync(`node "${testPath}"`, {
      stdio: "pipe",
      timeout: 60000, // 60 second timeout
    });
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`✅ ${suite.name} - PASSED (${duration}s)`);
    passedTests++;
    totalTests++;
    results.push({
      suite: suite.name,
      file: suite.file,
      status: "PASSED",
      duration: duration,
    });
  } catch (error) {
    console.log(`❌ ${suite.name} - FAILED`);
    console.log(`   Error: ${error.message}`);
    failedTests++;
    totalTests++;
    results.push({
      suite: suite.name,
      file: suite.file,
      status: "FAILED",
      error: error.message,
    });
  }
});

// Summary Report
console.log("\n" + "=" * 50);
console.log("📊 Test Results Summary");
console.log("=".repeat(50));
console.log(`Total Test Suites: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Skipped: ${testSuites.length - totalTests}`);

if (totalTests > 0) {
  console.log(
    `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`
  );
}

// Detailed Results
console.log("\n📋 Detailed Results:");
console.log("-".repeat(30));

results.forEach((result, index) => {
  const status =
    result.status === "PASSED"
      ? "✅"
      : result.status === "FAILED"
      ? "❌"
      : "⚠️";

  console.log(`${index + 1}. ${status} ${result.suite}`);
  console.log(`   File: ${result.file}`);

  if (result.status === "PASSED") {
    console.log(`   Duration: ${result.duration}s`);
  } else if (result.status === "FAILED") {
    console.log(`   Error: ${result.error}`);
  } else if (result.status === "SKIPPED") {
    console.log(`   Reason: ${result.reason}`);
  }
  console.log("");
});

// Final Status
if (failedTests === 0 && totalTests === testSuites.length) {
  console.log(
    "🎉 All tests passed! Your OdinBook application is working correctly."
  );
} else if (failedTests === 0) {
  console.log("✅ All available tests passed!");
} else {
  console.log("⚠️  Some tests failed. Please review the errors above.");
}

console.log("\n📚 Individual Test Execution:");
console.log("   node tests/auth.test.js      # Authentication tests");
console.log("   node tests/user.test.js      # User management tests");
console.log("   node tests/friends.test.js   # Friend system tests");
console.log("   node tests/posts.test.js     # Post management tests");
console.log("   node tests/profile.test.js   # Profile page tests");
console.log("   node tests/dashboard.test.js # Dashboard tests");
console.log("   node tests/services.test.js  # Service layer tests");
console.log("   node tests/integration.test.js # Integration tests");

console.log("\n🔧 Test Configuration:");
console.log("   - Database: Uses existing Prisma connection");
console.log("   - Timeout: 60 seconds per test suite");
console.log("   - Environment: Development mode");
console.log("   - Cleanup: Automatic test data cleanup");
