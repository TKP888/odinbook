#!/usr/bin/env node

/**
 * Backup Local Database
 * Creates a fresh backup of your local database with all test content
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("💾 Creating backup of local database with test content...\n");

const localDbUrl = "postgresql://antonypetsas@localhost:5432/odinbook";
const backupPath = path.join(
  __dirname,
  "..",
  "database",
  "odinbook_backup.sql"
);

try {
  // Check if local database is running
  console.log("🔍 Checking local database connection...");
  execSync(`psql "${localDbUrl}" -c "SELECT 1;"`, {
    stdio: "pipe",
    shell: true,
  });
  console.log("✅ Local database is accessible");

  // Create backup
  console.log("📦 Creating backup file...");
  execSync(`pg_dump "${localDbUrl}" > "${backupPath}"`, {
    stdio: "inherit",
    shell: true,
  });

  // Check backup file size
  const stats = fs.statSync(backupPath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`✅ Backup created successfully!`);
  console.log(`📁 File: ${backupPath}`);
  console.log(`📊 Size: ${fileSizeInMB} MB`);

  // Show some stats about the backup
  console.log("\n📈 Database content summary:");
  try {
    const userCount = execSync(
      `psql "${localDbUrl}" -t -c "SELECT COUNT(*) FROM users;"`,
      {
        encoding: "utf8",
        shell: true,
      }
    ).trim();
    const postCount = execSync(
      `psql "${localDbUrl}" -t -c "SELECT COUNT(*) FROM posts;"`,
      {
        encoding: "utf8",
        shell: true,
      }
    ).trim();
    const friendCount = execSync(
      `psql "${localDbUrl}" -t -c "SELECT COUNT(*) FROM \"FriendRequest\" WHERE status = 'accepted';"`,
      {
        encoding: "utf8",
        shell: true,
      }
    ).trim();

    console.log(`   👥 Users: ${userCount}`);
    console.log(`   📝 Posts: ${postCount}`);
    console.log(`   👫 Friends: ${friendCount}`);
  } catch (statsError) {
    console.log("   ⚠️  Could not get database stats");
  }

  console.log("\n🚀 Ready to deploy to Railway!");
  console.log("Run: npm run deploy:railway");
} catch (error) {
  console.error("\n❌ Backup failed:", error.message);
  console.log("\n🔧 Troubleshooting:");
  console.log("1. Make sure PostgreSQL is running locally");
  console.log("2. Check that your local database 'odinbook' exists");
  console.log("3. Verify your local DATABASE_URL is correct");
  console.log("4. Try running: createdb odinbook (if database doesn't exist)");
  process.exit(1);
}
