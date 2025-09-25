#!/usr/bin/env node

/**
 * Set Railway Environment Variables
 * Helps you set up environment variables for Railway deployment
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🚀 Railway Environment Setup\n");

console.log("Please provide your Railway DATABASE_URL:");
console.log(
  "(You can find this in Railway Dashboard → Your Project → PostgreSQL Service → Variables tab)"
);
console.log(
  "It should look like: postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway\n"
);

rl.question("Railway DATABASE_URL: ", (railwayDbUrl) => {
  if (!railwayDbUrl || !railwayDbUrl.includes("railway.app")) {
    console.log("❌ Invalid Railway DATABASE_URL. Please try again.");
    rl.close();
    return;
  }

  // Read current .env file
  const envPath = path.join(__dirname, "..", ".env");
  let envContent = "";

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }

  // Create backup of current .env
  const backupPath = path.join(__dirname, "..", ".env.backup");
  fs.writeFileSync(backupPath, envContent);
  console.log("✅ Backed up current .env to .env.backup");

  // Update DATABASE_URL for Railway
  const updatedEnvContent = envContent.replace(
    /DATABASE_URL=.*/,
    `DATABASE_URL="${railwayDbUrl}"`
  );

  // Write updated .env
  fs.writeFileSync(envPath, updatedEnvContent);
  console.log("✅ Updated .env with Railway DATABASE_URL");

  console.log("\n🎉 Ready to deploy!");
  console.log("Run: npm run deploy:railway");
  console.log("\n📝 To restore your local .env later:");
  console.log("   cp .env.backup .env");

  rl.close();
});
