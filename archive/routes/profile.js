const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../config/cloudinary");

const prisma = new PrismaClient();

// Gravatar utility functions
function getGravatarUrl(email, size = 200) {
  const hash = crypto
    .createHash("md5")
    .update(email.toLowerCase().trim())
    .digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=pg`;
}

async function getGravatarProfile(email) {
  try {
    const hash = crypto
      .createHash("md5")
      .update(email.toLowerCase().trim())
      .digest("hex");
    const response = await fetch(`https://www.gravatar.com/${hash}.json`);

    if (response.ok) {
      const data = await response.json();
      return data.entry?.[0] || null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching Gravatar profile:", error);
    return null;
  }
}

// Configure multer for memory storage (for Cloudinary upload)
const upload = multer({
  storage: multer.memoryStorage(),
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
        useGravatar: true,
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
            useGravatar: true,
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
      select: {
        id: true,
        content: true,
        photoUrl: true,
        createdAt: true,
        updatedAt: true,
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
                profilePicture: true,
                useGravatar: true,
                email: true,
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
      getGravatarUrl: getGravatarUrl,
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
    const profileUserId = req.params.id;

    // Check if user is trying to view their own profile
    if (profileUserId === req.user.id) {
      return res.redirect("/profile");
    }

    // Get current user to check for friend relationships
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        friends: {
          select: { id: true },
        },
        sentRequests: {
          where: { receiverId: profileUserId },
          select: { id: true, status: true },
        },
        receivedRequests: {
          where: { senderId: profileUserId },
          select: { id: true, status: true },
        },
      },
    });

    const profileUser = await prisma.user.findUnique({
      where: { id: profileUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        bio: true,
        profilePicture: true,
        useGravatar: true,
        birthday: true,
        gender: true,
        location: true,
        createdAt: true,
      },
    });

    if (!profileUser) {
      req.flash("error_msg", "User not found");
      return res.redirect("/friends/users");
    }

    // Check if they are friends
    const isFriend = currentUser.friends.some(
      (friend) => friend.id === profileUserId
    );

    // Check for pending friend requests
    let pendingRequest = null;
    if (!isFriend) {
      const sentRequest = currentUser.sentRequests.find(
        (req) => req.status === "pending"
      );
      const receivedRequest = currentUser.receivedRequests.find(
        (req) => req.status === "pending"
      );

      if (sentRequest) {
        pendingRequest = {
          ...sentRequest,
          senderId: req.user.id,
          receiverId: profileUserId,
        };
      } else if (receivedRequest) {
        pendingRequest = {
          ...receivedRequest,
          senderId: profileUserId,
          receiverId: req.user.id,
        };
      }
    }

    // Get profile user's posts - only show if friends
    let posts = [];
    if (isFriend) {
      posts = await prisma.post.findMany({
        where: { userId: profileUserId },
        select: {
          id: true,
          content: true,
          photoUrl: true,
          createdAt: true,
          updatedAt: true,
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
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    // Get profile user's friends - only show if friends
    let friends = [];
    if (isFriend) {
      friends = await prisma.user.findMany({
        where: {
          friends: {
            some: {
              id: profileUserId,
            },
          },
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
          birthday: true,
          gender: true,
          location: true,
          createdAt: true,
        },
      });
    }

    res.render("profile/index", {
      title: `${profileUser.firstName} ${profileUser.lastName}`,
      user: req.user,
      layout: "layouts/main",
      activePage: "profile",
      profileUser: profileUser,
      currentUser: req.user,
      isFriend: isFriend,
      pendingRequest: pendingRequest,
      posts: posts,
      friends: friends,
      getGravatarUrl: getGravatarUrl,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    req.flash("error_msg", "Error loading profile");
    res.redirect("/friends/users");
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

      // Get current user to check if they have an existing Cloudinary image
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          cloudinaryPublicId: true,
          profilePicture: true,
        },
      });

      // Upload file to Cloudinary
      const result = await uploadToCloudinary(req.file);

      if (!result.success) {
        return res.status(500).json({
          error: result.error || "Failed to upload file to Cloudinary",
        });
      }

      // Delete old image from Cloudinary if it exists
      if (currentUser?.cloudinaryPublicId) {
        await deleteFromCloudinary(currentUser.cloudinaryPublicId);
      }

      // Update user's profile picture in database
      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          profilePicture: result.url,
          cloudinaryPublicId: result.public_id,
          useGravatar: false,
        },
        select: {
          id: true,
          profilePicture: true,
          useGravatar: true,
        },
      });

      res.json({
        success: true,
        profilePicture: updatedUser.profilePicture,
        useGravatar: updatedUser.useGravatar,
        message: "Profile picture updated successfully",
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      res.status(500).json({ error: "Failed to upload profile picture" });
    }
  }
);

// Toggle Gravatar usage
router.post("/toggle-gravatar", ensureAuthenticated, async (req, res) => {
  try {
    const { useGravatar } = req.body;

    // Get current user to check if they have a Cloudinary image
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        cloudinaryPublicId: true,
        profilePicture: true,
        email: true,
      },
    });

    // If switching to Gravatar, delete the Cloudinary image
    if (useGravatar && currentUser?.cloudinaryPublicId) {
      await deleteFromCloudinary(currentUser.cloudinaryPublicId);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        useGravatar: useGravatar,
        profilePicture: useGravatar ? getGravatarUrl(req.user.email) : null,
        cloudinaryPublicId: useGravatar
          ? null
          : currentUser?.cloudinaryPublicId,
      },
      select: {
        id: true,
        profilePicture: true,
        useGravatar: true,
        email: true,
      },
    });

    res.json({
      success: true,
      profilePicture: updatedUser.profilePicture,
      useGravatar: updatedUser.useGravatar,
      message: useGravatar ? "Gravatar enabled" : "Gravatar disabled",
    });
  } catch (error) {
    console.error("Error toggling Gravatar:", error);
    res.status(500).json({ error: "Failed to toggle Gravatar" });
  }
});

// Get Gravatar profile data
router.get("/gravatar-profile", ensureAuthenticated, async (req, res) => {
  try {
    const gravatarProfile = await getGravatarProfile(req.user.email);

    res.json({
      success: true,
      profile: gravatarProfile,
      hasGravatar: !!gravatarProfile,
    });
  } catch (error) {
    console.error("Error fetching Gravatar profile:", error);
    res.status(500).json({ error: "Failed to fetch Gravatar profile" });
  }
});

module.exports = router;
