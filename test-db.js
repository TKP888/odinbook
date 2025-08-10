const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("🔍 Checking current database state...");

    // Check total users
    const totalUsers = await prisma.user.count();
    console.log(`📊 Total users: ${totalUsers}`);

    // Check users by type
    const seedUsers = await prisma.user.count({
      where: { isSeedUser: true },
    });

    const regularUsers = await prisma.user.count({
      where: { isSeedUser: false },
    });

    console.log(`🌱 Seed users: ${seedUsers}`);
    console.log(`👤 Regular users: ${regularUsers}`);

    // Check friend requests
    const pendingRequests = await prisma.friendRequest.count({
      where: { status: "pending" },
    });

    const acceptedRequests = await prisma.friendRequest.count({
      where: { status: "accepted" },
    });

    console.log(`📨 Pending friend requests: ${pendingRequests}`);
    console.log(`✅ Accepted friend requests: ${acceptedRequests}`);

    // Show some sample users
    const sampleUsers = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        username: true,
        email: true,
        isSeedUser: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("\n👥 Sample users:");
    sampleUsers.forEach((user) => {
      const type = user.isSeedUser ? "🌱 Seed" : "👤 Regular";
      console.log(
        `  ${type} - ${user.username} (${
          user.email
        }) - Created: ${user.createdAt.toDateString()}`
      );
    });
  } catch (error) {
    console.error("❌ Error checking database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
