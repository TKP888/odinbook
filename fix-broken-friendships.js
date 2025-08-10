const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function fixBrokenFriendships() {
  try {
    console.log("🔧 Fixing broken friendships...\n");

    // Get all users with their friend relationships
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        friends: { select: { id: true, username: true } },
        friendOf: { select: { id: true, username: true } },
      },
    });

    console.log("📊 Analyzing current friendships...");

    let fixedCount = 0;
    const brokenFriendships = [];

    for (const user of users) {
      const outgoingIds = user.friends.map((f) => f.id);
      const incomingIds = user.friendOf.map((f) => f.id);

      // Find one-way friendships (outgoing but not mutual)
      for (const friendId of outgoingIds) {
        if (!incomingIds.includes(friendId)) {
          const friend = user.friends.find((f) => f.id === friendId);
          brokenFriendships.push({
            user: user.username,
            friend: friend.username,
            userId: user.id,
            friendId: friendId,
            type: "outgoing_only",
          });
        }
      }
    }

    console.log(`\n❌ Found ${brokenFriendships.length} broken friendships:`);
    brokenFriendships.forEach((fs) => {
      console.log(`   ${fs.user} → ${fs.friend} (${fs.type})`);
    });

    if (brokenFriendships.length === 0) {
      console.log("✅ No broken friendships found!");
      return;
    }

    // Fix the broken friendships by making them mutual
    console.log("\n🔧 Fixing broken friendships...");

    for (const broken of brokenFriendships) {
      try {
        // Add the reverse relationship to make it mutual
        await prisma.user.update({
          where: { id: broken.friendId },
          data: {
            friends: {
              connect: { id: broken.userId },
            },
          },
        });

        console.log(`   ✅ Fixed: ${broken.friend} ↔ ${broken.user}`);
        fixedCount++;
      } catch (error) {
        console.log(
          `   ❌ Failed to fix ${broken.friend} ↔ ${broken.user}: ${error.message}`
        );
      }
    }

    console.log(
      `\n🎉 Fixed ${fixedCount} out of ${brokenFriendships.length} broken friendships!`
    );

    // Verify the fixes
    console.log("\n🔍 Verifying fixes...");
    const usersAfter = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        friends: { select: { id: true, username: true } },
        friendOf: { select: { id: true, username: true } },
      },
    });

    let mutualCount = 0;
    for (const user of usersAfter) {
      const outgoingIds = user.friends.map((f) => f.id);
      const incomingIds = user.friendOf.map((f) => f.id);
      const mutualFriends = outgoingIds.filter((id) =>
        incomingIds.includes(id)
      );

      if (mutualFriends.length > 0) {
        mutualCount++;
      }
    }

    console.log(
      `✅ Users with mutual friendships: ${mutualCount}/${usersAfter.length}`
    );
  } catch (error) {
    console.error("❌ Error fixing friendships:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBrokenFriendships();
