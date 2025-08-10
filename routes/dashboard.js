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

// Dashboard page
router.get("/", ensureAuthenticated, (req, res) => {
  console.log("Dashboard route - User data:", {
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
  });

  res.render("dashboard/index", {
    title: "Dashboard",
    user: req.user,
    layout: "layouts/main",
    activePage: "dashboard",
  });
});

// Get posts for dashboard
router.get("/posts", ensureAuthenticated, async (req, res) => {
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

    // Get posts from the user and their mutual friends
    const posts = await prisma.post.findMany({
      where: {
        OR: [{ userId: req.user.id }, { userId: { in: mutualFriendIds } }],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            useGravatar: true,
            email: true,
          },
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                profilePicture: true,
                useGravatar: true,
                email: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                profilePicture: true,
                useGravatar: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Add friend status to each post author
    const postsWithFriendStatus = posts.map((post) => {
      const isFriend = mutualFriendIds.includes(post.user.id);
      return {
        ...post,
        user: {
          ...post.user,
          isFriend,
        },
      };
    });

    // Return the expected format with posts and pagination
    res.json({
      posts: postsWithFriendStatus,
      pagination: {
        totalPosts: postsWithFriendStatus.length,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

module.exports = router;
