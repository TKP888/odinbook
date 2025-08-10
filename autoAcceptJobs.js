const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Store pending auto-accept jobs
const pendingJobs = new Map();

// Function to schedule auto-acceptance of a friend request
function scheduleAutoAccept(requestId, delayMs = 30000) {
  // Cancel existing job if it exists
  if (pendingJobs.has(requestId)) {
    clearTimeout(pendingJobs.get(requestId));
  }

  // Schedule new job
  const timeoutId = setTimeout(async () => {
    try {
      await autoAcceptFriendRequest(requestId);
      pendingJobs.delete(requestId);
    } catch (error) {
      console.error(`Error auto-accepting friend request ${requestId}:`, error);
      pendingJobs.delete(requestId);
    }
  }, delayMs);

  pendingJobs.set(requestId, timeoutId);
  console.log(
    `🤖 Scheduled auto-accept for friend request ${requestId} in ${delayMs}ms`
  );

  // Log the job details for debugging
  console.log(
    `📋 Job details: Request ID: ${requestId}, Delay: ${delayMs}ms, Total pending jobs: ${pendingJobs.size}`
  );
}

// Function to auto-accept a friend request
async function autoAcceptFriendRequest(requestId) {
  try {
    // Find the request and verify it's still pending
    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        id: requestId,
        status: "pending",
      },
      include: {
        receiver: true,
        sender: true,
      },
    });

    if (!friendRequest) {
      console.log(`Friend request ${requestId} not found or already processed`);
      return;
    }

    // Check if the receiver is a seed user
    if (!friendRequest.receiver.isSeedUser) {
      console.log(
        `Receiver is not a seed user, skipping auto-accept for request ${requestId}`
      );
      return;
    }

    console.log(
      `🤖 Auto-accepting friend request ${requestId} from ${friendRequest.sender.username} to ${friendRequest.receiver.username}`
    );

    // Use a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Update the friend request status
      await tx.friendRequest.update({
        where: { id: requestId },
        data: { status: "accepted" },
      });

      // Decline any reverse requests to prevent duplicates
      await tx.friendRequest.updateMany({
        where: {
          senderId: friendRequest.receiver.id,
          receiverId: friendRequest.sender.id,
          status: "pending",
          id: { not: requestId }, // Don't update the current request
        },
        data: { status: "declined" },
      });

      // Create the bidirectional friendship using the many-to-many relationship
      // First, add the sender to the receiver's friends list
      await tx.user.update({
        where: { id: friendRequest.receiver.id },
        data: {
          friends: {
            connect: { id: friendRequest.sender.id },
          },
        },
      });

      // Then, add the receiver to the sender's friends list to ensure mutual friendship
      await tx.user.update({
        where: { id: friendRequest.sender.id },
        data: {
          friends: {
            connect: { id: friendRequest.receiver.id },
          },
        },
      });
    });

    console.log(`✅ Successfully auto-accepted friend request ${requestId}`);
  } catch (error) {
    console.error(
      `❌ Error auto-accepting friend request ${requestId}:`,
      error
    );
  }
}

// Function to cancel a pending auto-accept job
function cancelAutoAccept(requestId) {
  if (pendingJobs.has(requestId)) {
    clearTimeout(pendingJobs.get(requestId));
    pendingJobs.delete(requestId);
    console.log(`Cancelled auto-accept for friend request ${requestId}`);
  }
}

// Function to get all pending jobs (for debugging)
function getPendingJobs() {
  return Array.from(pendingJobs.keys());
}

// Function to clear all pending jobs (useful for cleanup)
function clearAllJobs() {
  for (const [requestId, timeoutId] of pendingJobs) {
    clearTimeout(timeoutId);
  }
  pendingJobs.clear();
  console.log("Cleared all pending auto-accept jobs");
}

module.exports = {
  scheduleAutoAccept,
  autoAcceptFriendRequest,
  cancelAutoAccept,
  getPendingJobs,
  clearAllJobs,
};
