const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error_msg", "Please log in to view this resource");
  res.redirect("/auth/login");
}

// Friends page - redirect to dashboard since friend requests are now in header dropdown
router.get("/", ensureAuthenticated, (req, res) => {
  res.redirect("/dashboard");
});

// Search users endpoint
router.get("/search", ensureAuthenticated, async (req, res) => {
  try {
    const { q } = req.query;

    console.log("Search request received:", { query: q, userId: req.user.id });

    if (!q || q.trim().length === 0) {
      console.log("Empty search query, returning empty results");
      return res.json({ users: [] });
    }

    const searchTerm = q.trim();
    console.log("Searching for term:", searchTerm);

    // Search for users by firstName, lastName, username, or email
    // Exclude the current user from results
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { firstName: { contains: searchTerm, mode: "insensitive" } },
              { lastName: { contains: searchTerm, mode: "insensitive" } },
              { username: { contains: searchTerm, mode: "insensitive" } },
              { email: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
          {
            id: { not: req.user.id },
          },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        bio: true,
        profilePicture: true,
        createdAt: true,
      },
      take: 10, // Limit results to 10 users
    });

    console.log(`Found ${users.length} users matching "${searchTerm}"`);
    res.json({ users });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

// Send friend request endpoint
router.post("/request", ensureAuthenticated, async (req, res) => {
  const { receiverId } = req.body;
  if (!receiverId) return res.status(400).json({ error: "No receiverId" });

  // Prevent self-request
  if (receiverId === req.user.id)
    return res.status(400).json({ error: "Cannot add yourself" });

  // Prevent duplicate pending requests (check both directions)
  const existingRequest = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        {
          senderId: req.user.id,
          receiverId,
          status: "pending",
        },
        {
          senderId: receiverId,
          receiverId: req.user.id,
          status: "pending",
        },
      ],
    },
  });
  if (existingRequest) {
    if (existingRequest.senderId === req.user.id) {
      return res.status(400).json({ error: "Request already sent" });
    } else {
      return res
        .status(400)
        .json({ error: "You already have a pending request from this user" });
    }
  }

  // Prevent duplicate accepted friendships (check both directions)
  const alreadyFriends = await prisma.user.findFirst({
    where: {
      OR: [
        {
          id: req.user.id,
          friends: { some: { id: receiverId } },
        },
        {
          id: receiverId,
          friends: { some: { id: req.user.id } },
        },
      ],
    },
  });
  if (alreadyFriends) return res.status(400).json({ error: "Already friends" });

  await prisma.friendRequest.create({
    data: {
      senderId: req.user.id,
      receiverId,
    },
  });
  res.json({ success: true });
});

// Get received friend requests
router.get("/requests", ensureAuthenticated, async (req, res) => {
  try {
    const requests = await prisma.friendRequest.findMany({
      where: {
        receiverId: req.user.id,
        status: "pending",
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            bio: true,
            profilePicture: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ requests });
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    res.status(500).json({ error: "Failed to fetch friend requests" });
  }
});

// Get user's friends list
router.get("/list", ensureAuthenticated, async (req, res) => {
  try {
    const friends = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        friends: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            bio: true,
            profilePicture: true,
            createdAt: true,
          },
        },
      },
    });

    res.json({ friends: friends?.friends || [] });
  } catch (error) {
    console.error("Error fetching friends list:", error);
    res.status(500).json({ error: "Failed to fetch friends list" });
  }
});

// Accept friend request
router.post("/accept", ensureAuthenticated, async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId)
      return res.status(400).json({ error: "No requestId provided" });

    // Find the request and verify it belongs to the current user
    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        id: requestId,
        receiverId: req.user.id,
        status: "pending",
      },
    });

    if (!friendRequest) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    // Use a transaction to update the request, clean up duplicates, and create the bidirectional friendship
    await prisma.$transaction([
      // Update the friend request status
      prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "accepted" },
      }),
      // Decline any reverse requests to prevent duplicates
      prisma.friendRequest.updateMany({
        where: {
          senderId: req.user.id,
          receiverId: friendRequest.senderId,
          status: "pending",
          id: { not: requestId }, // Don't update the current request
        },
        data: { status: "declined" },
      }),
      // Add sender to receiver's friends list
      prisma.user.update({
        where: { id: req.user.id },
        data: {
          friends: {
            connect: { id: friendRequest.senderId },
          },
        },
      }),
      // Add receiver to sender's friends list
      prisma.user.update({
        where: { id: friendRequest.senderId },
        data: {
          friends: {
            connect: { id: req.user.id },
          },
        },
      }),
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    res.status(500).json({ error: "Failed to accept friend request" });
  }
});

// Decline friend request
router.post("/decline", ensureAuthenticated, async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId)
      return res.status(400).json({ error: "No requestId provided" });

    // Find the request and verify it belongs to the current user
    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        id: requestId,
        receiverId: req.user.id,
        status: "pending",
      },
    });

    if (!friendRequest) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    // Update the request status to declined
    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "declined" },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error declining friend request:", error);
    res.status(500).json({ error: "Failed to decline friend request" });
  }
});

// Remove friend (unfriend)
router.post("/remove", ensureAuthenticated, async (req, res) => {
  try {
    const { friendId } = req.body;
    if (!friendId)
      return res.status(400).json({ error: "No friendId provided" });

    // Verify they are actually friends
    const friendship = await prisma.user.findFirst({
      where: {
        id: req.user.id,
        friends: { some: { id: friendId } },
      },
    });

    if (!friendship) {
      return res.status(404).json({ error: "Friendship not found" });
    }

    // Remove friendship from both sides
    await prisma.$transaction([
      // Remove friend from user's friends list
      prisma.user.update({
        where: { id: req.user.id },
        data: {
          friends: {
            disconnect: { id: friendId },
          },
        },
      }),
      // Remove user from friend's friends list
      prisma.user.update({
        where: { id: friendId },
        data: {
          friends: {
            disconnect: { id: req.user.id },
          },
        },
      }),
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error("Error removing friend:", error);
    res.status(500).json({ error: "Failed to remove friend" });
  }
});

// Cleanup duplicate friend requests (admin function)
router.post("/cleanup-duplicates", ensureAuthenticated, async (req, res) => {
  try {
    // Find all pairs of users who have pending requests in both directions
    const duplicateRequests = await prisma.friendRequest.findMany({
      where: {
        status: "pending",
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    const duplicatesToRemove = [];
    const processedPairs = new Set();

    // Find duplicate pairs
    for (const request of duplicateRequests) {
      const pairKey = [request.senderId, request.receiverId].sort().join("-");

      if (processedPairs.has(pairKey)) {
        // This is a duplicate, mark for removal
        duplicatesToRemove.push(request.id);
      } else {
        processedPairs.add(pairKey);
      }
    }

    // Remove duplicate requests
    if (duplicatesToRemove.length > 0) {
      await prisma.friendRequest.updateMany({
        where: {
          id: { in: duplicatesToRemove },
        },
        data: { status: "declined" },
      });
    }

    res.json({
      success: true,
      removedCount: duplicatesToRemove.length,
      message: `Removed ${duplicatesToRemove.length} duplicate requests`,
    });
  } catch (error) {
    console.error("Error cleaning up duplicates:", error);
    res.status(500).json({ error: "Failed to cleanup duplicates" });
  }
});

module.exports = router;
