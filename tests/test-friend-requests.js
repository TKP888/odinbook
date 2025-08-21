const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testFriendRequests() {
  try {
    console.log("🔍 Testing Friend Request Functionality...\n");

    // Check pending friend requests
    const pendingRequests = await prisma.friendRequest.findMany({
      where: { status: "pending" },
      include: {
        sender: { select: { username: true, firstName: true, lastName: true } },
        receiver: {
          select: { username: true, firstName: true, lastName: true },
        },
      },
    });

    console.log("📨 Pending Friend Requests:");
    pendingRequests.forEach((req) => {
      console.log(`   ${req.sender.username} → ${req.receiver.username}`);
    });
    console.log(`Total pending requests: ${pendingRequests.length}\n`);

    // Check accepted friendships
    const acceptedRequests = await prisma.friendRequest.findMany({
      where: { status: "accepted" },
      include: {
        sender: { select: { username: true } },
        receiver: { select: { username: true } },
      },
    });

    console.log("✅ Accepted Friend Requests:");
    acceptedRequests.forEach((req) => {
      console.log(`   ${req.sender.username} ↔ ${req.receiver.username}`);
    });
    console.log(`Total accepted requests: ${acceptedRequests.length}\n`);

    // Check users with most friends
    const usersWithFriends = await prisma.user.findMany({
      select: {
        username: true,
        firstName: true,
        lastName: true,
        _count: {
          select: {
            friends: true,
            friendOf: true,
          },
        },
      },
      orderBy: {
        friends: {
          _count: "desc",
        },
      },
      take: 5,
    });

    console.log("👥 Users with Most Friends:");
    usersWithFriends.forEach((user) => {
      const totalFriends = user._count.friends + user._count.friendOf;
      console.log(
        `   ${user.username} (${user.firstName} ${user.lastName}): ${totalFriends} friends`
      );
    });

    // Check if there are any duplicate friendships
    const duplicateFriendships = await prisma.$queryRaw`
      SELECT 
        "senderId", 
        "receiverId", 
        COUNT(*) as count
      FROM "FriendRequest" 
      WHERE status = 'accepted' 
      GROUP BY "senderId", "receiverId" 
      HAVING COUNT(*) > 1
    `;

    if (duplicateFriendships.length > 0) {
      console.log("\n⚠️  Duplicate Friendships Found:");
      duplicateFriendships.forEach((dup) => {
        console.log(
          `   Sender: ${dup.senderId}, Receiver: ${dup.receiverId}, Count: ${dup.count}`
        );
      });
    } else {
      console.log("\n✅ No duplicate friendships found");
    }
  } catch (error) {
    console.error("❌ Error testing friend requests:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testFriendRequests();
