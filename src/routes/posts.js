const express = require("express");
const router = express.Router();
const multer = require("multer");
const { ensureAuthenticated, ensureOwnership } = require("../middleware/auth");
const { validatePost, validateComment } = require("../middleware/validation");
const postService = require("../services/postService");
const {
  uploadPostPhoto,
  deleteFromCloudinary,
} = require("../config/cloudinary");

// Configure multer for post photo uploads
const uploadPostPhotoMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Get posts from current user and friends (with pagination)
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await postService.getPostsForUser(req.user.id, page, limit);

    if (req.xhr || req.headers.accept?.includes("application/json")) {
      res.json(result);
    } else {
      res.render("dashboard/index", {
        posts: result.posts,
        pagination: result.pagination,
        user: req.user,
      });
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    if (req.xhr || req.headers.accept?.includes("application/json")) {
      res.status(500).json({ error: "Failed to fetch posts" });
    } else {
      req.flash("error_msg", "Failed to load posts");
      res.redirect("/dashboard");
    }
  }
});

// Create a new post
router.post(
  "/",
  ensureAuthenticated,
  uploadPostPhotoMiddleware.single("photo"),
  validatePost,
  async (req, res) => {
    try {
      console.log("Creating post with data:", {
        userId: req.user.id,
        content: req.body.content,
        hasFile: !!req.file,
        fileInfo: req.file
          ? {
              originalname: req.file.originalname,
              mimetype: req.file.mimetype,
              size: req.file.size,
            }
          : null,
      });

      let photoUrl = null;
      let cloudinaryPublicId = null;

      if (req.file) {
        console.log("Uploading photo to Cloudinary...");
        const uploadResult = await uploadPostPhoto(req.file);
        console.log("Cloudinary upload result:", uploadResult);

        if (uploadResult.success) {
          photoUrl = uploadResult.url;
          cloudinaryPublicId = uploadResult.public_id;
        } else {
          console.error("Cloudinary upload failed:", uploadResult.error);
          throw new Error(`Photo upload failed: ${uploadResult.error}`);
        }
      }

      const post = await postService.createPost(
        req.user.id,
        req.body.content,
        photoUrl,
        cloudinaryPublicId
      );

      console.log("Post created successfully:", {
        postId: post.id,
        hasPhoto: !!photoUrl,
      });

      if (req.xhr || req.headers.accept?.includes("application/json")) {
        res.json({ success: true, post });
      } else {
        req.flash("success_msg", "Post created successfully!");
        res.redirect("/dashboard");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      if (req.xhr || req.headers.accept?.includes("application/json")) {
        res.status(500).json({ error: "Failed to create post" });
      } else {
        req.flash("error_msg", "Failed to create post");
        res.redirect("/dashboard");
      }
    }
  }
);

// Get a single post by ID
router.get("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const post = await postService.getPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json({ success: true, post });
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// Update a post
router.put(
  "/:id",
  ensureAuthenticated,
  ensureOwnership("post"),
  uploadPostPhotoMiddleware.single("photo"),
  validatePost,
  async (req, res) => {
    try {
      console.log("Updating post:", {
        postId: req.params.id,
        content: req.body.content,
        hasNewFile: !!req.file,
        fileInfo: req.file
          ? {
              originalname: req.file.originalname,
              mimetype: req.file.mimetype,
              size: req.file.size,
            }
          : null,
      });

      // First, get the existing post to preserve its image data
      const existingPost = await postService.getPostById(req.params.id);
      if (!existingPost) {
        return res.status(404).json({ error: "Post not found" });
      }

      console.log("Existing post image data:", {
        hasPhoto: !!existingPost.photoUrl,
        photoUrl: existingPost.photoUrl,
        cloudinaryPublicId: existingPost.cloudinaryPublicId,
      });

      let photoUrl = existingPost.photoUrl; // Preserve existing image
      let cloudinaryPublicId = existingPost.cloudinaryPublicId; // Preserve existing image ID

      // Only update image if a new file is uploaded
      if (req.file) {
        console.log("New image uploaded, processing...");
        const uploadResult = await uploadPostPhoto(req.file);
        if (uploadResult.success) {
          photoUrl = uploadResult.url;
          cloudinaryPublicId = uploadResult.public_id;
          console.log("New image uploaded successfully:", {
            url: photoUrl,
            publicId: cloudinaryPublicId,
          });
        } else {
          throw new Error(`Photo upload failed: ${uploadResult.error}`);
        }
      } else {
        console.log("No new image, preserving existing image:", {
          photoUrl: photoUrl,
          cloudinaryPublicId: cloudinaryPublicId,
        });
      }

      const post = await postService.updatePost(
        req.params.id,
        req.user.id,
        req.body.content,
        photoUrl,
        cloudinaryPublicId
      );

      console.log("Post updated successfully:", {
        postId: post.id,
        hasPhoto: !!post.photoUrl,
        photoUrl: post.photoUrl,
      });

      res.json({ success: true, post });
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ error: "Failed to update post" });
    }
  }
);

// Delete a post
router.delete(
  "/:id",
  ensureAuthenticated,
  ensureOwnership("post"),
  async (req, res) => {
    try {
      await postService.deletePost(req.params.id, req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  }
);

// Toggle like on a post
router.post("/:id/like", ensureAuthenticated, async (req, res) => {
  try {
    console.log(`[POSTS ROUTE] Like request for post ${req.params.id} by user ${req.user.id}`);
    
    const result = await postService.toggleLike(req.params.id, req.user.id);
    
    console.log(`[POSTS ROUTE] Service returned:`, result);
    
    const response = {
      success: true,
      liked: result.liked,
      likesCount: result.likesCount,
    };
    
    console.log(`[POSTS ROUTE] Sending response:`, response);
    
    res.json(response);
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

// Get likes for a post
router.get("/:id/likes", ensureAuthenticated, async (req, res) => {
  try {
    const likes = await postService.getLikesForPost(req.params.id);
    res.json({ success: true, likes });
  } catch (error) {
    console.error("Error fetching likes:", error);
    res.status(500).json({ error: "Failed to fetch likes" });
  }
});

// Add comment to a post
router.post(
  "/:id/comments",
  ensureAuthenticated,
  validateComment,
  async (req, res) => {
    try {
      const comment = await postService.addComment(
        req.params.id,
        req.user.id,
        req.body.content
      );
      res.json({ success: true, comment });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  }
);

// Get comments for a post
router.get("/:id/comments", ensureAuthenticated, async (req, res) => {
  try {
    const comments = await postService.getCommentsForPost(req.params.id);
    res.json({ success: true, comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Update a comment
router.put(
  "/comments/:id",
  ensureAuthenticated,
  ensureOwnership("comment"),
  validateComment,
  async (req, res) => {
    try {
      const comment = await postService.updateComment(
        req.params.id,
        req.user.id,
        req.body.content
      );
      res.json({ success: true, comment });
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ error: "Failed to update comment" });
    }
  }
);

// Delete a comment
router.delete(
  "/comments/:id",
  ensureAuthenticated,
  ensureOwnership("comment"),
  async (req, res) => {
    try {
      await postService.deleteComment(req.params.id, req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  }
);

module.exports = router;
