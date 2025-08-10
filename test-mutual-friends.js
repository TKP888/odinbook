const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testMutualFriends() {
  try {
    console.log("=== TESTING MUTUAL FRIENDS LOGIC ===");

    // Find the "ant" user
    const antUser = await prisma.user.findUnique({
      where: { username: "ant" },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        friends: {
          select: { id: true, username: true },
        },
        friendOf: {
          select: { id: true, username: true },
        },
      },
    });

    if (!antUser) {
      console.log("User 'ant' not found!");
      return;
    }

    console.log(
      `\n=== USER: ${antUser.username} (${antUser.firstName} ${antUser.lastName}) ===`
    );
    console.log(`User ID: ${antUser.id}`);

    // Test the exact logic from the posts route
    const outgoingFriends = antUser.friends.map((friend) => friend.id);
    const incomingFriends = antUser.friendOf.map((friend) => friend.id);

    // Find mutual friends (users who are in both lists)
    const mutualFriendIds = outgoingFriends.filter((id) =>
      incomingFriends.includes(id)
    );

    console.log("\n=== FRIENDSHIP ANALYSIS ===");
    console.log(
      "Outgoing friends:",
      outgoingFriends.map((id) => {
        const friend = antUser.friends.find((f) => f.id === id);
        return friend ? friend.username : id;
      })
    );
    console.log(
      "Incoming friends:",
      incomingFriends.map((id) => {
        const friend = antUser.friendOf.find((f) => f.id === id);
        return friend ? friend.username : id;
      })
    );
    console.log(
      "Mutual friends:",
      mutualFriendIds.map((id) => {
        const friend =
          antUser.friends.find((f) => f.id === id) ||
          antUser.friendOf.find((f) => f.id === id);
        return friend ? friend.username : id;
      })
    );

    console.log(`\n=== RESULTS ===`);
    console.log(`Outgoing friends count: ${outgoingFriends.length}`);
    console.log(`Incoming friends count: ${incomingFriends.length}`);
    console.log(`Mutual friends count: ${mutualFriendIds.length}`);

    if (mutualFriendIds.length === 0) {
      console.log(
        "✅ RESULT: No mutual friends - should only show user's own posts"
      );

      // Test the where clause
      const whereClause = { userId: antUser.id };
      console.log("Where clause:", whereClause);

      // Check how many posts this would return
      const ownPosts = await prisma.post.count({
        where: whereClause,
      });
      console.log(`Posts from user only: ${ownPosts}`);
    } else {
      console.log(
        "❌ RESULT: Has mutual friends - should show posts from user and mutual friends"
      );

      // Test the where clause
      const whereClause = { userId: { in: [antUser.id, ...mutualFriendIds] } };
      console.log("Where clause:", whereClause);

      // Check how many posts this would return
      const allPosts = await prisma.post.count({
        where: whereClause,
      });
      console.log(`Posts from user and mutual friends: ${allPosts}`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testMutualFriends();
