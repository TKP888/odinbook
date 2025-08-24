const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { scheduleAutoAccept, getPendingJobs } = require("../autoAcceptJobs");

const prisma = new PrismaClient();

// Middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
  console.log("ensureAuthenticated middleware called:", {
    isAuthenticated: req.isAuthenticated(),
    user: req.user ? { id: req.user.id, username: req.user.username } : null,
  });

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

// Check if user has friends
router.get("/check-friends", ensureAuthenticated, async (req, res) => {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        friends: {
          select: { id: true },
        },
        friendOf: {
          select: { id: true },
        },
      },
    });

    // Find mutual friends (users who are in both lists)
    const outgoingFriends =
      currentUser?.friends?.map((friend) => friend.id) || [];
    const incomingFriends =
      currentUser?.friendOf?.map((friend) => friend.id) || [];
    const mutualFriendIds = outgoingFriends.filter((id) =>
      incomingFriends.includes(id)
    );

    res.json({
      hasFriends: mutualFriendIds.length > 0,
      friendCount: mutualFriendIds.length,
    });
  } catch (error) {
    console.error("Error checking friends:", error);
    res.status(500).json({ error: "Failed to check friends status" });
  }
});

// Get all users with friend status
router.get("/users", ensureAuthenticated, async (req, res) => {
  // Check if this is an AJAX request (for the API)
  if (
    req.xhr ||
    req.headers["x-requested-with"] === "XMLHttpRequest" ||
    (req.headers.accept && req.headers.accept.includes("application/json")) ||
    req.headers["content-type"] === "application/json"
  ) {
    try {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          friends: {
            select: { id: true },
          },
          friendOf: {
            select: { id: true },
          },
          sentRequests: {
            where: { status: "pending" },
            select: { id: true, receiverId: true },
          },
          receivedRequests: {
            where: { status: "pending" },
            select: { id: true, senderId: true },
          },
        },
      });

      // Find mutual friends (users who are in both lists)
      const outgoingFriends =
        currentUser?.friends?.map((friend) => friend.id) || [];
      const incomingFriends =
        currentUser?.friendOf?.map((friend) => friend.id) || [];
      const mutualFriendIds = outgoingFriends.filter((id) =>
        incomingFriends.includes(id)
      );

      // Get outgoing and incoming request IDs with their request IDs
      const outgoingRequests = currentUser?.sentRequests || [];
      const incomingRequests = currentUser?.receivedRequests || [];

      // Get all users except the current user
      const users = await prisma.user.findMany({
        where: { id: { not: req.user.id } },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          bio: true,
          profilePicture: true,
          useGravatar: true,
          email: true,
          isSeedUser: true,
        },
      });

      // Add friend status to each user
      const usersWithStatus = users.map((user) => {
        const isFriend = mutualFriendIds.includes(user.id);
        const outgoingRequest = outgoingRequests.find(
          (req) => req.receiverId === user.id
        );
        const incomingRequest = incomingRequests.find(
          (req) => req.senderId === user.id
        );

        let status = "none";
        let requestId = null;

        if (isFriend) {
          status = "friend";
        } else if (outgoingRequest) {
          status = "request_sent";
          requestId = outgoingRequest.id;
        } else if (incomingRequest) {
          status = "request_received";
          requestId = incomingRequest.id;
        }

        // Generate gravatar URL if user uses gravatar
        let gravatarUrl = null;
        if (user.useGravatar && user.email) {
          const crypto = require("crypto");
          const hash = crypto
            .createHash("md5")
            .update(user.email.toLowerCase().trim())
            .digest("hex");
          gravatarUrl = `https://www.gravatar.com/avatar/${hash}?s=50&d=identicon&r=pg`;
        }

        return {
          ...user,
          status,
          requestId,
          gravatarUrl,
        };
      });

      res.json(usersWithStatus);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  } else {
    // Regular page request - render the users view
    res.render("friends/users", {
      title: "Users",
      user: req.user,
      layout: "layouts/main",
      activePage: "users",
    });
  }
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

    // Get current user's friend relationships and requests
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        friends: {
          select: { id: true },
        },
        friendOf: {
          select: { id: true },
        },
        sentRequests: {
          where: { status: "pending" },
          select: { id: true, receiverId: true },
        },
        receivedRequests: {
          where: { status: "pending" },
          select: { id: true, senderId: true },
        },
      },
    });

    // Find mutual friends (users who are in both lists)
    const outgoingFriends =
      currentUser?.friends?.map((friend) => friend.id) || [];
    const incomingFriends =
      currentUser?.friendOf?.map((friend) => friend.id) || [];
    const mutualFriendIds = outgoingFriends.filter((id) =>
      incomingFriends.includes(id)
    );

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
        useGravatar: true,
        createdAt: true,
      },
      take: 10, // Limit results to 10 users
    });

    console.log(`Found ${users.length} users matching "${searchTerm}"`);

    // Add friendship status and gravatar URLs to search results
    const usersWithStatus = users.map((user) => {
      let gravatarUrl = null;
      if (user.useGravatar && user.email) {
        const crypto = require("crypto");
        const hash = crypto
          .createHash("md5")
          .update(user.email.toLowerCase().trim())
          .digest("hex");
        gravatarUrl = `https://www.gravatar.com/avatar/${hash}?s=50&d=identicon&r=pg`;
      }

      // Check friendship status
      const isFriend = mutualFriendIds.includes(user.id);

      // Check for pending requests
      const sentRequest = currentUser.sentRequests.find(
        (req) => req.receiverId === user.id
      );
      const receivedRequest = currentUser.receivedRequests.find(
        (req) => req.senderId === user.id
      );

      let status = "none";
      let requestId = null;

      if (isFriend) {
        status = "friend";
      } else if (sentRequest) {
        status = "request_sent";
        requestId = sentRequest.id;
      } else if (receivedRequest) {
        status = "request_received";
        requestId = receivedRequest.id;
      }

      return {
        ...user,
        gravatarUrl,
        status,
        requestId,
      };
    });

    res.json({ users: usersWithStatus });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

// Send friend request endpoint
router.post("/request", ensureAuthenticated, async (req, res) => {
  try {
    const { receiverId } = req.body;
    if (!receiverId) return res.status(400).json({ error: "No receiverId" });

    // Prevent self-request
    if (receiverId === req.user.id)
      return res.status(400).json({ error: "Cannot add yourself" });

    // Check if users are already friends
    const existingFriendship = await prisma.user.findFirst({
      where: {
        id: req.user.id,
        friends: { some: { id: receiverId } },
      },
    });

    if (existingFriendship) {
      return res.status(400).json({ error: "Already friends" });
    }

    // Check if there's already a pending request in either direction
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

    // Get receiver info to check if they're a seed user
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { isSeedUser: true, username: true },
    });

    if (!receiver) {
      return res.status(404).json({ error: "User not found" });
    }

    const newRequest = await prisma.friendRequest.create({
      data: {
        senderId: req.user.id,
        receiverId,
      },
    });

    // If receiver is a seed user, schedule auto-acceptance after 30-60 seconds
    if (receiver && receiver.isSeedUser) {
      const delayMs = Math.floor(Math.random() * 30000) + 30000; // Random delay between 30-60 seconds
      scheduleAutoAccept(newRequest.id, delayMs);
      console.log(
        `Scheduled auto-accept for friend request to seed user ${receiver.username} in ${delayMs}ms`
      );
    }

    res.json({ success: true, requestId: newRequest.id });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({ error: "Failed to send friend request" });
  }
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
            useGravatar: true,
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
    await prisma.$transaction(async (tx) => {
      // Update the friend request status
      await tx.friendRequest.update({
        where: { id: requestId },
        data: { status: "accepted" },
      });

      // Decline any reverse requests to prevent duplicates
      await tx.friendRequest.updateMany({
        where: {
          senderId: req.user.id,
          receiverId: friendRequest.senderId,
          status: "pending",
          id: { not: requestId }, // Don't update the current request
        },
        data: { status: "declined" },
      });

      // Create the bidirectional friendship using the many-to-many relationship
      // First, add the sender to the current user's friends list
      await tx.user.update({
        where: { id: req.user.id },
        data: {
          friends: {
            connect: { id: friendRequest.senderId },
          },
        },
      });

      // Then, add the current user to the sender's friends list to ensure mutual friendship
      await tx.user.update({
        where: { id: friendRequest.senderId },
        data: {
          friends: {
            connect: { id: req.user.id },
          },
        },
      });
    });

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

    // Find the request and verify it belongs to the current user (either as sender or receiver)
    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        id: requestId,
        OR: [{ receiverId: req.user.id }, { senderId: req.user.id }],
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

// Cancel friend request (for sender)
router.post("/cancel-request", ensureAuthenticated, async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId)
      return res.status(400).json({ error: "No requestId provided" });

    // Find the request and verify it belongs to the current user as the sender
    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        id: requestId,
        senderId: req.user.id,
        status: "pending",
      },
    });

    if (!friendRequest) {
      return res
        .status(404)
        .json({ error: "Friend request not found or you cannot cancel it" });
    }

    // Update the request status to cancelled
    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "cancelled" },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error cancelling friend request:", error);
    res.status(500).json({ error: "Failed to cancel friend request" });
  }
});

// Remove friend (unfriend)
router.post("/remove", ensureAuthenticated, async (req, res) => {
  try {
    const { friendId } = req.body;
    if (!friendId) {
      return res.status(400).json({ error: "No friendId provided" });
    }

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

    // Remove friendship from both sides using the many-to-many relationship
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

// Debug route to check auto-accept job status (admin only)
router.get("/auto-accept-status", ensureAuthenticated, async (req, res) => {
  try {
    // Check if user is admin (you can modify this logic as needed)
    if (req.user.username !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const pendingJobs = getPendingJobs();
    res.json({
      success: true,
      pendingJobsCount: pendingJobs.length,
      pendingJobs: pendingJobs,
      message: `There are ${pendingJobs.length} pending auto-accept jobs`,
    });
  } catch (error) {
    console.error("Error getting auto-accept status:", error);
    res.status(500).json({ error: "Failed to get auto-accept status" });
  }
});

module.exports = router;
