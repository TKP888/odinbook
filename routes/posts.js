const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const {
  uploadPostPhoto,
  deleteFromCloudinary,
} = require("../config/cloudinary");

const prisma = new PrismaClient();

// Configure multer for post photo uploads
const uploadPostPhotoMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for post photos
  },
  fileFilter: function (req, file, cb) {
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

// Get posts from current user and friends (with pagination)
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let whereClause = {};

    console.log(
      `[POSTS] Fetching posts for user: ${req.user.username} (${req.user.id})`
    );
    console.log(`[POSTS] Request query:`, req.query);

    // Get current user's friends using the correct relationship
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

    // Create array of user IDs to include (current user + MUTUAL friends only)
    // A mutual friendship means both users have each other in their friends list
    const outgoingFriends =
      currentUser?.friends?.map((friend) => friend.id) || [];
    const incomingFriends =
      currentUser?.friendOf?.map((friend) => friend.id) || [];

    // Find mutual friends (users who are in both lists)
    const mutualFriendIds = outgoingFriends.filter((id) =>
      incomingFriends.includes(id)
    );

    console.log(
      `[POSTS] Outgoing friends: ${outgoingFriends.length}, Incoming friends: ${incomingFriends.length}`
    );
    console.log(`[POSTS] Mutual friends: ${mutualFriendIds.length}`);
    console.log(`[POSTS] Mutual friend IDs:`, mutualFriendIds);

    // Only show posts from current user and their MUTUAL friends
    // If user has no mutual friends, only show their own posts
    if (mutualFriendIds.length === 0) {
      whereClause = { userId: req.user.id };
      console.log(
        `[POSTS] No mutual friends found, only showing user's own posts`
      );
    } else {
      whereClause = { userId: { in: [req.user.id, ...mutualFriendIds] } };
      console.log(
        `[POSTS] Including posts from user and ${mutualFriendIds.length} mutual friends`
      );
    }

    console.log(`[POSTS] Final where clause:`, whereClause);

    const posts = await prisma.post.findMany({
      where: whereClause,
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
      skip,
      take: limit,
    });

    console.log(
      `[POSTS] Found ${posts.length} posts for user ${req.user.username}`
    );

    // Log details about each post being returned
    posts.forEach((post, index) => {
      console.log(
        `[POSTS] Post ${index + 1}: User ${post.user.username} (${
          post.user.firstName
        } ${post.user.lastName}) - Content: ${post.content.substring(0, 50)}...`
      );
    });

    const totalPosts = await prisma.post.count({
      where: whereClause,
    });
    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      posts: posts,
      pagination: {
        totalPosts: totalPosts,
        totalPages: totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching posts",
    });
  }
});

// Get posts for a specific user
router.get("/user/:userId", ensureAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
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

    // Check if the target user is a friend
    const isFriend = mutualFriendIds.includes(parseInt(userId));

    // Get posts from the target user
    const posts = await prisma.post.findMany({
      where: {
        authorId: parseInt(userId),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
            gravatarHash: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profilePicture: true,
                gravatarHash: true,
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

    // Add friend status to each post
    const postsWithFriendStatus = posts.map((post) => ({
      ...post,
      author: {
        ...post.author,
        isFriend,
      },
    }));

    res.json(postsWithFriendStatus);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// Get posts by current user
router.get("/my-posts", ensureAuthenticated, async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        userId: req.user.id,
      },
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

    res.json({ posts });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ error: "Failed to fetch user posts" });
  }
});

// Get all posts (admin/discover feature - optional)
router.get("/all", ensureAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
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
      skip,
      take: limit,
    });

    const totalPosts = await prisma.post.count();
    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching all posts:", error);
    res.status(500).json({ error: "Failed to fetch all posts" });
  }
});

// Get a specific post by ID
router.get("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
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
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ post });
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// Create a new post
router.post(
  "/",
  ensureAuthenticated,
  uploadPostPhotoMiddleware.single("photo"),
  async (req, res) => {
    try {
      const { content } = req.body;
      let photoUrl = null;
      let cloudinaryPublicId = null;

      // Handle photo upload if present
      if (req.file) {
        const uploadResult = await uploadPostPhoto(req.file);
        if (uploadResult.success) {
          photoUrl = uploadResult.url;
          cloudinaryPublicId = uploadResult.public_id;
        } else {
          return res.status(400).json({
            success: false,
            message: "Failed to upload photo",
          });
        }
      }

      // Allow posts with just photos (no text required)
      if ((!content || content.trim().length === 0) && !req.file) {
        return res.status(400).json({
          success: false,
          message: "Post must contain content or a photo",
        });
      }

      // Regular user - create post in database
      const newPost = await prisma.post.create({
        data: {
          content: content ? content.trim() : "",
          userId: req.user.id,
          photoUrl,
          cloudinaryPublicId,
        },
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
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      res.json({
        success: true,
        message: "Post created successfully",
        post: newPost,
      });
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({
        success: false,
        message: "Error creating post",
      });
    }
  }
);

// Update a post (only by the post owner)
router.put("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Post content is required" });
    }

    if (content.length > 1000) {
      return res
        .status(400)
        .json({ error: "Post content cannot exceed 1000 characters" });
    }

    // Check if post exists and belongs to the user
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (existingPost.userId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only edit your own posts" });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        content: content.trim(),
        updatedAt: new Date(),
      },
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
    });

    res.json({ post: updatedPost, success: true });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ error: "Failed to update post" });
  }
});

// Delete a post (only by the post owner)
router.delete("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if post exists and belongs to the user
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (existingPost.userId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only delete your own posts" });
    }

    await prisma.post.delete({
      where: { id },
    });

    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// Like/unlike a post
router.post("/:id/like", ensureAuthenticated, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user already liked the post
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: userId,
          postId: postId,
        },
      },
    });

    if (existingLike) {
      // Unlike the post
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId: userId,
            postId: postId,
          },
        },
      });

      const likeCount = await prisma.like.count({
        where: { postId: postId },
      });

      res.json({
        success: true,
        message: "Post unliked successfully",
        liked: false,
        likeCount: likeCount,
      });
    } else {
      // Like the post
      await prisma.like.create({
        data: {
          userId: userId,
          postId: postId,
        },
      });

      const likeCount = await prisma.like.count({
        where: { postId: postId },
      });

      res.json({
        success: true,
        message: "Post liked successfully",
        liked: true,
        likeCount: likeCount,
      });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling like",
    });
  }
});

// Get likes for a post
router.get("/:id/likes", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const likes = await prisma.like.findMany({
      where: { postId: id },
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
    });

    res.json({ success: true, likes });
  } catch (error) {
    console.error("Error fetching likes:", error);
    res.status(500).json({ error: "Failed to fetch likes" });
  }
});

// Add a comment to a post
router.post("/:id/comments", ensureAuthenticated, async (req, res) => {
  try {
    const postId = req.params.id;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment content cannot be empty",
      });
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Create the comment
    const newComment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: req.user.id,
        postId: postId,
      },
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
    });

    res.json({
      success: true,
      message: "Comment added successfully",
      comment: newComment,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({
      success: false,
      message: "Error adding comment",
    });
  }
});

// Get comments for a post
router.get("/:id/comments", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const comments = await prisma.comment.findMany({
      where: { postId: id },
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
    });

    res.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Update a comment (only by the comment owner)
router.put("/comments/:commentId", ensureAuthenticated, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    if (content.length > 250) {
      return res
        .status(400)
        .json({ error: "Comment cannot exceed 250 characters" });
    }

    // Check if comment exists and belongs to the user
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (existingComment.userId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only edit your own comments" });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
      },
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
    });

    res.json({
      success: true,
      comment: updatedComment,
      message: "Comment updated successfully",
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ error: "Failed to update comment" });
  }
});

// Delete a comment (only by the comment owner)
router.delete("/comments/:commentId", ensureAuthenticated, async (req, res) => {
  try {
    const { commentId } = req.params;

    // Check if comment exists and belongs to the user
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (existingComment.userId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only delete your own comments" });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    res.json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

module.exports = router;
