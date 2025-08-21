const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function markSeedUsers() {
  try {
    console.log("🌱 Marking some users as seed users for testing...");

    // Get some users to mark as seed users (excluding admin and guest)
    const usersToMark = await prisma.user.findMany({
      where: {
        AND: [
          { username: { not: "admin" } },
          { username: { not: "AdminUser" } },
          { username: { not: "Guest" } },
          { username: { not: "guest" } },
        ],
      },
      take: 10, // Mark 10 users as seed users
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (usersToMark.length === 0) {
      console.log("❌ No users found to mark as seed users");
      return;
    }

    console.log(`📝 Found ${usersToMark.length} users to mark as seed users:`);
    usersToMark.forEach((user) => {
      console.log(`  - ${user.username} (${user.email})`);
    });

    // Mark them as seed users
    const updateResult = await prisma.user.updateMany({
      where: {
        id: { in: usersToMark.map((u) => u.id) },
      },
      data: {
        isSeedUser: true,
      },
    });

    console.log(
      `✅ Successfully marked ${updateResult.count} users as seed users`
    );

    // Verify the update
    const seedUsersCount = await prisma.user.count({
      where: { isSeedUser: true },
    });

    console.log(`📊 Total seed users now: ${seedUsersCount}`);
  } catch (error) {
    console.error("❌ Error marking seed users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

markSeedUsers();
