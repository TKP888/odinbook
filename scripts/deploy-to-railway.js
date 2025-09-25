#!/usr/bin/env node

/**
 * Deploy Database to Railway
 * This script helps deploy your existing database to Railway
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Starting Railway database deployment...\n");

// Check if DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("❌ DATABASE_URL environment variable is not set!");
  console.log(
    "Please set your Railway DATABASE_URL in your environment or .env file"
  );
  process.exit(1);
}

console.log(
  "✅ DATABASE_URL found:",
  databaseUrl.replace(/\/\/.*@/, "//***:***@")
);

try {
  // Step 1: Generate Prisma client
  console.log("\n📦 Generating Prisma client...");
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("✅ Prisma client generated");

  // Step 2: Push schema to Railway database
  console.log("\n🗄️  Pushing database schema to Railway...");
  execSync("npx prisma db push", { stdio: "inherit" });
  console.log("✅ Database schema pushed");

  // Step 3: Check if backup file exists and import data
  const backupPath = path.join(
    __dirname,
    "..",
    "database",
    "odinbook_backup.sql"
  );

  if (fs.existsSync(backupPath)) {
    console.log(
      "\n📥 Found database backup file - importing your test content..."
    );

    try {
      // Import the backup data
      console.log("🔄 Importing data from backup...");
      execSync(`psql "${databaseUrl}" < "${backupPath}"`, {
        stdio: "inherit",
        shell: true,
      });
      console.log("✅ Test content successfully imported to Railway!");
    } catch (importError) {
      console.log("⚠️  Direct import failed, trying alternative method...");
      console.log("📋 Manual import instructions:");
      console.log("   1. Install Railway CLI: npm install -g @railway/cli");
      console.log("   2. Login: railway login");
      console.log("   3. Connect: railway connect postgres");
      console.log("   4. Import: \\i database/odinbook_backup.sql");
      console.log(
        '   5. Or use: psql "${databaseUrl}" < database/odinbook_backup.sql'
      );
    }
  } else {
    console.log(
      "\n📝 No backup file found. Creating fresh backup from local database..."
    );

    try {
      // Create a fresh backup from local database
      const localDbUrl = "postgresql://antonypetsas@localhost:5432/odinbook";
      console.log("🔄 Creating backup from local database...");
      execSync(`pg_dump "${localDbUrl}" > "${backupPath}"`, {
        stdio: "inherit",
        shell: true,
      });
      console.log("✅ Backup created, now importing to Railway...");

      // Import the fresh backup
      execSync(`psql "${databaseUrl}" < "${backupPath}"`, {
        stdio: "inherit",
        shell: true,
      });
      console.log("✅ Test content successfully imported to Railway!");
    } catch (backupError) {
      console.log("⚠️  Could not create backup from local database");
      console.log("🌱 Seeding database with sample data instead...");
      execSync("npm run db:seed", { stdio: "inherit" });
      console.log("✅ Database seeded with sample data");
    }
  }

  console.log("\n🎉 Railway database deployment completed!");
  console.log("\nNext steps:");
  console.log("1. Deploy your application to Railway");
  console.log("2. Test the application with the new database");
  console.log("3. If you have existing data, import it using the backup file");
} catch (error) {
  console.error("\n❌ Deployment failed:", error.message);
  process.exit(1);
}
