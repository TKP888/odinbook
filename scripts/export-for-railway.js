#!/usr/bin/env node

/**
 * Export Local Database for Railway
 * Creates a clean export of your local database for Railway deployment
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("📤 Exporting local database for Railway deployment...\n");

const localDbUrl = "postgresql://antonypetsas@localhost:5432/odinbook";
const exportPath = path.join(__dirname, "..", "database", "railway_export.sql");

try {
  // Check if local database is running
  console.log("🔍 Checking local database connection...");
  execSync(`psql "${localDbUrl}" -c "SELECT 1;"`, {
    stdio: "pipe",
    shell: true,
  });
  console.log("✅ Local database is accessible");

  // Create clean export for Railway
  console.log("📦 Creating Railway export...");
  execSync(`pg_dump "${localDbUrl}" --clean --if-exists --no-owner --no-privileges > "${exportPath}"`, {
    stdio: "inherit",
    shell: true,
  });

  // Check export file size
  const stats = fs.statSync(exportPath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`✅ Railway export created successfully!`);
  console.log(`📁 File: ${exportPath}`);
  console.log(`📊 Size: ${fileSizeInMB} MB`);

  // Show some stats about the export
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

  console.log("\n🚀 Next steps:");
  console.log("1. Go to Railway Dashboard");
  console.log("2. Set up your PostgreSQL database service");
  console.log("3. Get the Railway DATABASE_URL");
  console.log("4. Run: psql 'railway-database-url' < database/railway_export.sql");

} catch (error) {
  console.error("\n❌ Export failed:", error.message);
  console.log("\n🔧 Troubleshooting:");
  console.log("1. Make sure PostgreSQL is running locally");
  console.log("2. Check that your local database 'odinbook' exists");
  console.log("3. Verify your local DATABASE_URL is correct");
  process.exit(1);
}
