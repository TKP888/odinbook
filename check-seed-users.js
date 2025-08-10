const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkSeedUsers() {
  try {
    console.log("🔍 Checking all users in the database...\n");

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        isSeedUser: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    console.log(`📊 Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(
        `${index + 1}. ${user.username} (${user.firstName} ${user.lastName})`
      );
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Seed User: ${user.isSeedUser}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Error checking users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkSeedUsers();
