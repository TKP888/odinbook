const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testPostVisibility() {
  try {
    console.log("🔍 Testing Post Visibility and Friendship Relationships\n");
    
    // Antony's user ID
    const antonyId = "cme5syibz000ttxj1pv49h63o";
    
    console.log("=== USER INFORMATION ===");
    const antony = await prisma.user.findUnique({
      where: { id: antonyId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });
    
    if (!antony) {
      console.log("❌ Antony user not found!");
      return;
    }
    
    console.log(`👤 Current User: ${antony.username} (${antony.firstName} ${antony.lastName})`);
    console.log(`📧 Email: ${antony.email}`);
    console.log(`🆔 ID: ${antony.id}\n`);
    
    console.log("=== FRIENDSHIP RELATIONSHIPS ===");
    
    // Get Antony's friends
    const antonyWithFriends = await prisma.user.findUnique({
      where: { id: antonyId },
      select: {
        friends: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        friendOf: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    
    const outgoingFriends = antonyWithFriends?.friends || [];
    const incomingFriends = antonyWithFriends?.friendOf || [];
    
    console.log(`📤 Outgoing Friends: ${outgoingFriends.length}`);
    outgoingFriends.forEach(friend => {
      console.log(`   - ${friend.username} (${friend.firstName} ${friend.lastName})`);
    });
    
    console.log(`\n📥 Incoming Friends: ${incomingFriends.length}`);
    incomingFriends.forEach(friend => {
      console.log(`   - ${friend.username} (${friend.firstName} ${friend.lastName})`);
    });
    
    // Find mutual friends
    const mutualFriendIds = outgoingFriends
      .map(f => f.id)
      .filter(id => incomingFriends.some(f => f.id === id));
    
    console.log(`\n🤝 Mutual Friends: ${mutualFriendIds.length}`);
    const mutualFriends = outgoingFriends.filter(f => mutualFriendIds.includes(f.id));
    mutualFriends.forEach(friend => {
      console.log(`   - ${friend.username} (${friend.firstName} ${friend.lastName})`);
    });
    
    console.log("\n=== POST VISIBILITY LOGIC ===");
    
    // Determine which user IDs should have visible posts
    const visibleUserIds = [antonyId, ...mutualFriendIds];
    console.log(`👥 Users whose posts should be visible: ${visibleUserIds.length}`);
    console.log(`   - Antony (${antonyId})`);
    mutualFriendIds.forEach(id => {
      const friend = mutualFriends.find(f => f.id === id);
      console.log(`   - ${friend.username} (${id})`);
    });
    
    console.log("\n=== CURRENT POSTS IN DATABASE ===");
    
    // Get all posts with user information
    const allPosts = await prisma.post.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });
    
    console.log(`📝 Total posts found: ${allPosts.length}`);
    
    // Categorize posts
    const antonyPosts = allPosts.filter(p => p.userId === antonyId);
    const friendPosts = allPosts.filter(p => mutualFriendIds.includes(p.userId));
    const otherPosts = allPosts.filter(p => !visibleUserIds.includes(p.userId));
    
    console.log(`\n📱 Antony's posts: ${antonyPosts.length}`);
    antonyPosts.forEach(post => {
      console.log(`   - ${post.content.substring(0, 50)}...`);
    });
    
    console.log(`\n👥 Friend posts: ${friendPosts.length}`);
    friendPosts.forEach(post => {
      console.log(`   - ${post.user.username}: ${post.content.substring(0, 50)}...`);
    });
    
    console.log(`\n🚫 Other posts (should NOT be visible): ${otherPosts.length}`);
    otherPosts.forEach(post => {
      console.log(`   - ${post.user.username} (${post.user.firstName} ${post.user.lastName}): ${post.content.substring(0, 50)}...`);
    });
    
    console.log("\n=== POSTS THAT SHOULD BE VISIBLE ===");
    
    // Get posts that should be visible according to the logic
    const visiblePosts = await prisma.post.findMany({
      where: {
        userId: { in: visibleUserIds }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });
    
    console.log(`✅ Posts that should be visible: ${visiblePosts.length}`);
    visiblePosts.forEach(post => {
      console.log(`   - ${post.user.username} (${post.user.firstName} ${post.user.lastName}): ${post.content.substring(0, 50)}...`);
    });
    
    console.log("\n=== SUMMARY ===");
    console.log(`🔍 Antony has ${mutualFriendIds.length} mutual friends`);
    console.log(`📝 Antony has ${antonyPosts.length} posts`);
    console.log(`👥 Friends have ${friendPosts.length} posts`);
    console.log(`🚫 Other users have ${otherPosts.length} posts`);
    console.log(`✅ Total visible posts: ${visiblePosts.length}`);
    
    if (otherPosts.length > 0) {
      console.log(`\n⚠️  WARNING: Found ${otherPosts.length} posts from non-friends!`);
      console.log("   These posts should NOT be visible in Antony's feed.");
      console.log("   If you're seeing them, there might be a caching issue.");
    }
    
  } catch (error) {
    console.error("❌ Error testing post visibility:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPostVisibility();
