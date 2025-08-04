const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../public/uploads");
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "profile-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

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
    // Get current user with profile picture and friends
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        bio: true,
        profilePicture: true,
        birthday: true,
        gender: true,
        location: true,
        createdAt: true,
        friends: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            bio: true,
            profilePicture: true,
            birthday: true,
            gender: true,
            location: true,
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
      user: currentUser,
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
      return res
        .status(400)
        .json({ error: "Bio cannot exceed 500 characters" });
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

// Update profile endpoint
router.put("/update", ensureAuthenticated, async (req, res) => {
  try {
    const { firstName, lastName, username, birthday, gender, location } =
      req.body;

    // Validate input
    if (!firstName || !lastName || !username) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (firstName.length > 50 || lastName.length > 50) {
      return res
        .status(400)
        .json({ error: "Name fields cannot exceed 50 characters" });
    }

    if (username.length < 3 || username.length > 30) {
      return res
        .status(400)
        .json({ error: "Username must be between 3 and 30 characters" });
    }

    // Check if username is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username,
        id: { not: req.user.id }, // Exclude current user
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Username is already taken" });
    }

    const updateData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim().toLowerCase(),
      birthday: birthday ? new Date(birthday) : null,
      gender: gender || null,
      location: location || null,
    };

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        birthday: true,
        gender: true,
        location: true,
      },
    });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// View other user's profile
router.get("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.params.id;

    // Don't allow viewing own profile through this route
    if (userId === req.user.id) {
      return res.redirect("/profile");
    }

    // Get the user's profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        bio: true,
        profilePicture: true,
        birthday: true,
        gender: true,
        location: true,
        createdAt: true,
        friends: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            bio: true,
            profilePicture: true,
            birthday: true,
            gender: true,
            location: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect("/dashboard");
    }

    // Get user's posts
    const posts = await prisma.post.findMany({
      where: { userId: userId },
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

    // Check if current user is friends with this user
    const isFriend = user.friends.some((friend) => friend.id === req.user.id);

    // Check for pending friend requests
    const pendingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          {
            senderId: req.user.id,
            receiverId: userId,
            status: "pending",
          },
          {
            senderId: userId,
            receiverId: req.user.id,
            status: "pending",
          },
        ],
      },
    });

    res.render("profile/index", {
      title: `${user.firstName} ${user.lastName}'s Profile`,
      user: req.user,
      profileUser: user,
      friends: user.friends,
      posts: posts,
      layout: "layouts/main",
      activePage: "profile",
      isFriend,
      pendingRequest,
    });
  } catch (error) {
    console.error("Error loading user profile:", error);
    req.flash("error_msg", "Failed to load user profile");
    res.redirect("/dashboard");
  }
});

// Upload profile picture endpoint
router.post(
  "/upload-picture",
  ensureAuthenticated,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Generate the URL for the uploaded file
      const fileUrl = `/uploads/${req.file.filename}`;

      // Update user's profile picture in database
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: { profilePicture: fileUrl },
        select: {
          id: true,
          profilePicture: true,
        },
      });

      res.json({
        success: true,
        profilePicture: updatedUser.profilePicture,
        message: "Profile picture updated successfully",
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      res.status(500).json({ error: "Failed to upload profile picture" });
    }
  }
);

module.exports = router;
