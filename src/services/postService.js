const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class PostService {
  async getPostsForUser(userId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      // Get current user's friends
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          friends: { select: { id: true } },
          friendOf: { select: { id: true } },
        },
      });

      // Find mutual friends
      const outgoingFriends =
        currentUser?.friends?.map((friend) => friend.id) || [];
      const incomingFriends =
        currentUser?.friendOf?.map((friend) => friend.id) || [];
      const mutualFriendIds = outgoingFriends.filter((id) =>
        incomingFriends.includes(id)
      );

      // Build where clause
      const whereClause =
        mutualFriendIds.length === 0
          ? { userId }
          : { userId: { in: [userId, ...mutualFriendIds] } };

      const posts = await prisma.post.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              useGravatar: true,
              email: true,
            },
          },
          likes: {
            select: { userId: true },
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  profilePicture: true,
                  useGravatar: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      });

      const totalPosts = await prisma.post.count({ where: whereClause });
      const hasNextPage = skip + limit < totalPosts;

      return {
        posts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPosts / limit),
          hasNextPage,
          totalPosts,
        },
      };
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
  }

  async getPostById(postId) {
    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              useGravatar: true,
              email: true,
            },
          },
          likes: {
            select: { userId: true },
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  profilePicture: true,
                  useGravatar: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
      return post;
    } catch (error) {
      console.error("Error fetching post by ID:", error);
      throw error;
    }
  }

  async createPost(
    userId,
    content,
    photoUrl = null,
    cloudinaryPublicId = null
  ) {
    try {
      const post = await prisma.post.create({
        data: {
          content,
          userId,
          photoUrl,
          cloudinaryPublicId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              useGravatar: true,
              email: true,
            },
          },
          likes: { select: { userId: true } },
          comments: [],
        },
      });

      return post;
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  }

  async updatePost(
    postId,
    userId,
    content,
    photoUrl = null,
    cloudinaryPublicId = null
  ) {
    try {
      const post = await prisma.post.update({
        where: { id: postId, userId },
        data: {
          content,
          photoUrl,
          cloudinaryPublicId,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              useGravatar: true,
              email: true,
            },
          },
          likes: { select: { userId: true } },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  profilePicture: true,
                  useGravatar: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      return post;
    } catch (error) {
      console.error("Error updating post:", error);
      throw error;
    }
  }

  async deletePost(postId, userId) {
    try {
      await prisma.post.delete({
        where: { id: postId, userId },
      });
      return true;
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error;
    }
  }

  async toggleLike(postId, userId) {
    try {
      console.log(
        `[POST SERVICE] toggleLike called for post ${postId} by user ${userId}`
      );

      const existingLike = await prisma.like.findUnique({
        where: { userId_postId: { userId, postId } },
      });

      console.log(`[POST SERVICE] Existing like found:`, existingLike);

      if (existingLike) {
        console.log(`[POST SERVICE] Deleting existing like`);
        await prisma.like.delete({
          where: { userId_postId: { userId, postId } },
        });
      } else {
        console.log(`[POST SERVICE] Creating new like`);
        await prisma.like.create({
          data: { userId, postId },
        });
      }

      // Get the updated likes count for this post
      const likesCount = await prisma.like.count({
        where: { postId },
      });

      console.log(`[POST SERVICE] Updated likes count:`, likesCount);

      const result = {
        liked: !existingLike, // true if we just liked, false if we just unliked
        likesCount,
      };

      console.log(`[POST SERVICE] Returning result:`, result);
      return result;
    } catch (error) {
      console.error("Error toggling like:", error);
      throw error;
    }
  }

  async addComment(postId, userId, content) {
    try {
      const comment = await prisma.comment.create({
        data: { content, userId, postId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              useGravatar: true,
              email: true,
            },
          },
        },
      });

      return comment;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  }

  async updateComment(commentId, userId, content) {
    try {
      const comment = await prisma.comment.update({
        where: { id: commentId, userId },
        data: { content },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              useGravatar: true,
              email: true,
            },
          },
        },
      });

      return comment;
    } catch (error) {
      console.error("Error updating comment:", error);
      throw error;
    }
  }

  async getCommentsForPost(postId) {
    try {
      const comments = await prisma.comment.findMany({
        where: { postId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              useGravatar: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });
      return comments;
    } catch (error) {
      console.error("Error fetching comments for post:", error);
      throw error;
    }
  }

  async deleteComment(commentId, userId) {
    try {
      await prisma.comment.delete({
        where: { id: commentId, userId },
      });
      return true;
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  }

  async getLikesForPost(postId) {
    try {
      const likes = await prisma.like.findMany({
        where: { postId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              useGravatar: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });
      return likes;
    } catch (error) {
      console.error("Error fetching likes for post:", error);
      throw error;
    }
  }
}

module.exports = new PostService();
