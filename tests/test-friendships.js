const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testFriendships() {
  try {
    console.log("🔍 Testing friendship relationships...\n");

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        isSeedUser: true,
        friends: {
          select: { id: true, username: true },
        },
        friendOf: {
          select: { id: true, username: true },
        },
      },
    });

    console.log("📊 Current users and their relationships:");
    users.forEach((user) => {
      console.log(
        `\n👤 ${user.username} (${
          user.isSeedUser ? "Seed User" : "Regular User"
        })`
      );
      console.log(
        `   Friends (outgoing): ${
          user.friends.map((f) => f.username).join(", ") || "None"
        }`
      );
      console.log(
        `   Friends (incoming): ${
          user.friendOf.map((f) => f.username).join(", ") || "None"
        }`
      );

      // Check for mutual friendships
      const outgoingIds = user.friends.map((f) => f.id);
      const incomingIds = user.friendOf.map((f) => f.id);
      const mutualFriends = outgoingIds.filter((id) =>
        incomingIds.includes(id)
      );

      if (mutualFriends.length > 0) {
        const mutualUsernames = mutualFriends.map((id) => {
          const friend = user.friends.find((f) => f.id === id);
          return friend.username;
        });
        console.log(`   ✅ Mutual friends: ${mutualUsernames.join(", ")}`);
      } else {
        console.log(`   ❌ No mutual friendships`);
      }
    });

    // Check friend requests
    console.log("\n📨 Friend Requests:");
    const requests = await prisma.friendRequest.findMany({
      include: {
        sender: { select: { username: true } },
        receiver: { select: { username: true } },
      },
    });

    requests.forEach((request) => {
      console.log(
        `   ${request.sender.username} → ${request.receiver.username} (${request.status})`
      );
    });

    // Check the friendship table directly
    console.log("\n🔗 Direct friendship table check:");
    const friendships = await prisma.$queryRaw`
      SELECT 
        a.username as user_a,
        b.username as user_b
      FROM "_Friendship" f
      JOIN users a ON f."A" = a.id
      JOIN users b ON f."B" = b.id
      ORDER BY a.username, b.username
    `;

    friendships.forEach((friendship) => {
      console.log(`   ${friendship.user_a} ↔ ${friendship.user_b}`);
    });
  } catch (error) {
    console.error("❌ Error testing friendships:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testFriendships();
