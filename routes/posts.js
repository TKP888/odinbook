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

// Get posts from current user and friends (with pagination)
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get current user's friends
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        friends: {
          select: { id: true },
        },
      },
    });

    // Create array of user IDs to include (current user + friends)
    const allowedUserIds = [
      req.user.id,
      ...(currentUser?.friends?.map((friend) => friend.id) || []),
    ];

    // If user has no friends, show all posts for now (for demo purposes)
    const whereClause =
      allowedUserIds.length > 1 ? { userId: { in: allowedUserIds } } : {}; // Show all posts if user has no friends

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

    const totalPosts = await prisma.post.count({
      where: whereClause,
    });
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
    console.error("Error fetching posts:", error);
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
router.post("/", ensureAuthenticated, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Post content is required" });
    }

    if (content.length > 250) {
      return res
        .status(400)
        .json({ error: "Post content cannot exceed 250 characters" });
    }

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
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
      },
    });

    res.status(201).json({ post, success: true });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});

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

// Like/Unlike a post
router.post("/:id/like", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if user already liked the post
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: req.user.id,
          postId: id,
        },
      },
    });

    if (existingLike) {
      // Unlike the post
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId: req.user.id,
            postId: id,
          },
        },
      });

      res.json({
        success: true,
        liked: false,
        message: "Post unliked",
      });
    } else {
      // Like the post
      await prisma.like.create({
        data: {
          userId: req.user.id,
          postId: id,
        },
      });

      res.json({
        success: true,
        liked: true,
        message: "Post liked",
      });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "Failed to toggle like" });
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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ likes });
  } catch (error) {
    console.error("Error fetching likes:", error);
    res.status(500).json({ error: "Failed to fetch likes" });
  }
});

// Add a comment to a post
router.post("/:id/comments", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    if (content.length > 500) {
      return res
        .status(400)
        .json({ error: "Comment cannot exceed 500 characters" });
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: req.user.id,
        postId: id,
      },
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
    });

    res.status(201).json({ comment, success: true });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Failed to create comment" });
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
