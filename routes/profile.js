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

// Profile page
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    // Get current user's friends
    const currentUser = await prisma.user.findUnique({
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

    const friends = currentUser?.friends || [];

    // Get current user's posts
    const posts = await prisma.post.findMany({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            profilePicture: true,
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
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.render("profile/index", {
      title: "Profile",
      user: req.user,
      friends: friends,
      posts: posts,
      layout: "layouts/main",
      activePage: "profile",
    });
  } catch (error) {
    console.error("Error loading profile page:", error);
    req.flash("error_msg", "Failed to load profile page");
    res.redirect("/dashboard");
  }
});

// Update bio endpoint
router.put("/bio", ensureAuthenticated, async (req, res) => {
  try {
    const { bio } = req.body;
    
    if (bio && bio.length > 500) {
      return res.status(400).json({ error: "Bio cannot exceed 500 characters" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { bio: bio || null },
      select: {
        id: true,
        bio: true,
      },
    });

    res.json({ success: true, bio: updatedUser.bio });
  } catch (error) {
    console.error("Error updating bio:", error);
    res.status(500).json({ error: "Failed to update bio" });
  }
});

module.exports = router;
