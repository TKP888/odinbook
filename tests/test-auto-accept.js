const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testAutoAccept() {
  try {
    console.log("🤖 Testing auto-accept functionality...\n");

    // Get all pending friend requests
    const pendingRequests = await prisma.friendRequest.findMany({
      where: { status: "pending" },
      include: {
        sender: { select: { id: true, username: true, isSeedUser: true } },
        receiver: { select: { id: true, username: true, isSeedUser: true } },
      },
    });

    console.log(`📨 Found ${pendingRequests.length} pending friend requests:`);
    pendingRequests.forEach((request) => {
      console.log(
        `   ${request.sender.username} → ${request.receiver.username} (Receiver is seed user: ${request.receiver.isSeedUser})`
      );
    });

    // Find requests that should be auto-accepted (receiver is seed user)
    const autoAcceptRequests = pendingRequests.filter(
      (request) => request.receiver.isSeedUser
    );

    console.log(
      `\n🤖 ${autoAcceptRequests.length} requests should be auto-accepted:`
    );
    autoAcceptRequests.forEach((request) => {
      console.log(
        `   ${request.sender.username} → ${request.receiver.username}`
      );
    });

    if (autoAcceptRequests.length === 0) {
      console.log("No requests to auto-accept.");
      return;
    }

    // Auto-accept the first request as a test
    const testRequest = autoAcceptRequests[0];
    console.log(
      `\n🧪 Testing auto-accept for: ${testRequest.sender.username} → ${testRequest.receiver.username}`
    );

    // Use a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Update the friend request status
      await tx.friendRequest.update({
        where: { id: testRequest.id },
        data: { status: "accepted" },
      });

      // Decline any reverse requests to prevent duplicates
      await tx.friendRequest.updateMany({
        where: {
          senderId: testRequest.receiver.id,
          receiverId: testRequest.sender.id,
          status: "pending",
          id: { not: testRequest.id },
        },
        data: { status: "declined" },
      });

      // Create the bidirectional friendship using the many-to-many relationship
      // First, add the sender to the receiver's friends list
      await tx.user.update({
        where: { id: testRequest.receiver.id },
        data: {
          friends: {
            connect: { id: testRequest.sender.id },
          },
        },
      });

      // Then, add the receiver to the sender's friends list to ensure mutual friendship
      await tx.user.update({
        where: { id: testRequest.sender.id },
        data: {
          friends: {
            connect: { id: testRequest.receiver.id },
          },
        },
      });
    });

    console.log("✅ Successfully auto-accepted the test request!");

    // Verify the friendship was created
    const sender = await prisma.user.findUnique({
      where: { id: testRequest.sender.id },
      select: {
        username: true,
        friends: { select: { username: true } },
        friendOf: { select: { username: true } },
      },
    });

    const receiver = await prisma.user.findUnique({
      where: { id: testRequest.receiver.id },
      select: {
        username: true,
        friends: { select: { username: true } },
        friendOf: { select: { username: true } },
      },
    });

    console.log(`\n🔍 Verification:`);
    console.log(
      `${sender.username} friends: ${sender.friends
        .map((f) => f.username)
        .join(", ")}`
    );
    console.log(
      `${sender.username} friendOf: ${sender.friendOf
        .map((f) => f.username)
        .join(", ")}`
    );
    console.log(
      `${receiver.username} friends: ${receiver.friends
        .map((f) => f.username)
        .join(", ")}`
    );
    console.log(
      `${receiver.username} friendOf: ${receiver.friendOf
        .map((f) => f.username)
        .join(", ")}`
    );

    // Check if it's now mutual
    const senderFriendIds = sender.friends.map((f) => f.id);
    const senderFriendOfIds = sender.friendOf.map((f) => f.id);
    const receiverFriendIds = receiver.friends.map((f) => f.id);
    const receiverFriendOfIds = receiver.friendOf.map((f) => f.id);

    const isMutual =
      senderFriendIds.includes(receiver.id) &&
      receiverFriendIds.includes(sender.id);
    console.log(`\n🤝 Is friendship mutual? ${isMutual ? "✅ YES" : "❌ NO"}`);
  } catch (error) {
    console.error("❌ Error testing auto-accept:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testAutoAccept();
