#!/usr/bin/env node

/**
 * Import Data to Railway Database
 * Simple script to import backup data to Railway database
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("📥 Importing test content to Railway database...\n");

// Railway DATABASE_URL (internal - works from Railway's network)
const railwayDbUrl =
  "postgresql://postgres:clGAbmktBbLzixlQAQxiweHXCnBRekas@postgres.railway.internal:5432/railway";
const backupPath = path.join(
  __dirname,
  "..",
  "database",
  "odinbook_backup.sql"
);

if (!fs.existsSync(backupPath)) {
  console.error("❌ Backup file not found:", backupPath);
  console.log("Please run: npm run backup:local");
  process.exit(1);
}

try {
  console.log("🔄 Importing data from backup...");
  console.log("📁 Backup file:", backupPath);

  // Import the backup data
  execSync(`psql "${railwayDbUrl}" < "${backupPath}"`, {
    stdio: "inherit",
    shell: true,
  });

  console.log("✅ Test content successfully imported to Railway!");
  console.log("\n🎉 Your Railway database now has all your test content!");
} catch (error) {
  console.error("\n❌ Import failed:", error.message);
  console.log("\n🔧 This might be because:");
  console.log("1. Railway database is not ready yet");
  console.log("2. You need to wait for Railway deployment to complete");
  console.log("3. The internal URL only works from Railway's network");
  console.log(
    "\n💡 Try running this script after Railway deployment completes"
  );
  process.exit(1);
}
