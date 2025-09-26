#!/usr/bin/env node

/**
 * Replace Railway Database with Local Database
 * Clears the existing Railway database and imports local database content
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🔄 Railway Database Replacement Script\n");

// Local database info
const localDbUrl = "postgresql://antonypetsas@localhost:5432/odinbook";
const exportPath = path.join(__dirname, "..", "database", "railway_export.sql");

// Check if export file exists
if (!fs.existsSync(exportPath)) {
  console.error("❌ Export file not found:", exportPath);
  console.log("Please run: npm run export:railway");
  process.exit(1);
}

console.log("📁 Using export file:", exportPath);

// Get Railway DATABASE_URL
rl.question(
  "Enter your Railway DATABASE_URL (external URL): ",
  (railwayDbUrl) => {
    if (
      !railwayDbUrl ||
      (!railwayDbUrl.includes("railway.app") &&
        !railwayDbUrl.includes("rlwy.net"))
    ) {
      console.log(
        "❌ Invalid Railway DATABASE_URL. It should contain 'railway.app' or 'rlwy.net'"
      );
      rl.close();
      return;
    }

    console.log("\n🔍 Testing Railway database connection...");

    try {
      // Test connection
      execSync(`psql "${railwayDbUrl}" -c "SELECT 1;"`, {
        stdio: "pipe",
        shell: true,
      });
      console.log("✅ Railway database connection successful");
    } catch (error) {
      console.error("❌ Cannot connect to Railway database:", error.message);
      console.log(
        "\n🔧 Make sure you're using the external DATABASE_URL from Railway dashboard"
      );
      rl.close();
      return;
    }

    console.log(
      "\n⚠️  WARNING: This will completely replace the Railway database!"
    );
    console.log(
      "📊 Current Railway database will be cleared and replaced with your local database."
    );

    rl.question("Are you sure you want to continue? (yes/no): ", (confirm) => {
      if (confirm.toLowerCase() !== "yes") {
        console.log("❌ Operation cancelled");
        rl.close();
        return;
      }

      try {
        console.log("\n🗑️  Clearing Railway database...");

        // Clear the database by dropping and recreating the public schema
        execSync(
          `psql "${railwayDbUrl}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;"`,
          {
            stdio: "inherit",
            shell: true,
          }
        );

        console.log("✅ Railway database cleared");

        console.log("\n📥 Importing local database to Railway...");

        // Import the local database
        execSync(`psql "${railwayDbUrl}" < "${exportPath}"`, {
          stdio: "inherit",
          shell: true,
        });

        console.log("✅ Local database successfully imported to Railway!");

        // Verify the import
        console.log("\n🔍 Verifying import...");
        try {
          const userCount = execSync(
            `psql "${railwayDbUrl}" -t -c "SELECT COUNT(*) FROM users;"`,
            {
              encoding: "utf8",
              shell: true,
            }
          ).trim();

          const postCount = execSync(
            `psql "${railwayDbUrl}" -t -c "SELECT COUNT(*) FROM posts;"`,
            {
              encoding: "utf8",
              shell: true,
            }
          ).trim();

          console.log(`✅ Import verification successful!`);
          console.log(`   👥 Users: ${userCount}`);
          console.log(`   📝 Posts: ${postCount}`);
        } catch (verifyError) {
          console.log(
            "⚠️  Could not verify import stats, but import completed"
          );
        }

        console.log(
          "\n🎉 Railway database replacement completed successfully!"
        );
        console.log("🚀 Your Railway app now has your local database content!");
      } catch (error) {
        console.error("\n❌ Database replacement failed:", error.message);
        console.log("\n🔧 Troubleshooting:");
        console.log("1. Make sure your Railway DATABASE_URL is correct");
        console.log("2. Check that Railway database service is running");
        console.log("3. Verify the export file exists and is valid");
      }

      rl.close();
    });
  }
);
