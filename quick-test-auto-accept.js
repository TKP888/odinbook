const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function quickTest() {
  try {
    console.log("🚀 Quick test of auto-accept functionality...");

    // Get a regular user (sender)
    const sender = await prisma.user.findFirst({
      where: {
        isSeedUser: false,
        username: "testuser",
      },
      select: { id: true, username: true },
    });

    // Get a seed user (receiver)
    const receiver = await prisma.user.findFirst({
      where: { isSeedUser: true },
      select: { id: true, username: true },
    });

    if (!sender || !receiver) {
      console.log("❌ Users not found");
      return;
    }

    console.log(`📤 Sender: ${sender.username} (${sender.id})`);
    console.log(
      `📥 Receiver: ${receiver.username} (${receiver.id}) - 🌱 Seed User`
    );

    // Check if they can send a request
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: sender.id, receiverId: receiver.id },
          { senderId: receiver.id, receiverId: sender.id },
        ],
      },
    });

    if (existingRequest) {
      console.log(`⚠️  Request already exists: ${existingRequest.status}`);
      return;
    }

    console.log("✅ Ready to test! Now:");
    console.log("1. Log into your app as testuser");
    console.log("2. Go to /friends/users");
    console.log("3. Send friend request to", receiver.username);
    console.log("4. Watch the server console for auto-accept logs");
    console.log("5. Wait 30-60 seconds for auto-accept");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

quickTest();
