/**
 * Test Utilities for OdinBook
 * Shared utilities and helpers for all test suites
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

class TestUtils {
  constructor() {
    this.prisma = new PrismaClient();
    this.testUsers = [];
    this.testPosts = [];
    this.testFriendRequests = [];
  }

  /**
   * Create a test user with given data
   */
  async createTestUser(userData = {}) {
    const defaultData = {
      email: `test${Date.now()}@example.com`,
      username: `testuser${Date.now()}`,
      password: "TestPassword123!",
      firstName: "Test",
      lastName: "User",
      isSeedUser: false,
      ...userData,
    };

    const hashedPassword = await bcrypt.hash(defaultData.password, 10);

    // Prepare data for database insertion
    const userDataForDb = {
      email: defaultData.email,
      username: defaultData.username,
      password: hashedPassword,
      firstName: defaultData.firstName,
      lastName: defaultData.lastName,
      isSeedUser: defaultData.isSeedUser,
    };

    // Add optional fields only if they exist
    if (defaultData.birthday) {
      userDataForDb.birthday = new Date(defaultData.birthday);
    }
    if (defaultData.gender) {
      userDataForDb.gender = defaultData.gender;
    }
    if (defaultData.location) {
      userDataForDb.location = defaultData.location;
    }
    if (defaultData.bio) {
      userDataForDb.bio = defaultData.bio;
    }

    const user = await this.prisma.user.create({
      data: userDataForDb,
    });

    this.testUsers.push(user);
    return user;
  }

  /**
   * Create multiple test users
   */
  async createTestUsers(count = 3) {
    const users = [];
    for (let i = 0; i < count; i++) {
      const user = await this.createTestUser({
        email: `testuser${i}${Date.now()}@example.com`,
        username: `testuser${i}${Date.now()}`,
        firstName: `Test${i}`,
        lastName: `User${i}`,
      });
      users.push(user);
    }
    return users;
  }

  /**
   * Create a test post
   */
  async createTestPost(userId, postData = {}) {
    const defaultData = {
      content: `Test post content ${Date.now()}`,
      userId,
      ...postData,
    };

    const post = await this.prisma.post.create({
      data: defaultData,
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

    this.testPosts.push(post);
    return post;
  }

  /**
   * Create a friend request
   */
  async createFriendRequest(senderId, receiverId, status = "pending") {
    const request = await this.prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
        status,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.testFriendRequests.push(request);
    return request;
  }

  /**
   * Create a friendship between two users
   */
  async createFriendship(user1Id, user2Id) {
    await this.prisma.$transaction(async (tx) => {
      // Create bidirectional friendship
      await tx.user.update({
        where: { id: user1Id },
        data: { friends: { connect: { id: user2Id } } },
      });

      await tx.user.update({
        where: { id: user2Id },
        data: { friends: { connect: { id: user1Id } } },
      });
    });
  }

  /**
   * Create a like on a post
   */
  async createLike(userId, postId) {
    return await this.prisma.like.create({
      data: { userId, postId },
    });
  }

  /**
   * Create a comment on a post
   */
  async createComment(userId, postId, content = "Test comment") {
    return await this.prisma.comment.create({
      data: { userId, postId, content },
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
  }

  /**
   * Clean up all test data
   */
  async cleanup() {
    try {
      // Delete test data in reverse order of dependencies
      if (this.testPosts.length > 0) {
        await this.prisma.like.deleteMany({
          where: { postId: { in: this.testPosts.map((p) => p.id) } },
        });
        await this.prisma.comment.deleteMany({
          where: { postId: { in: this.testPosts.map((p) => p.id) } },
        });
        await this.prisma.post.deleteMany({
          where: { id: { in: this.testPosts.map((p) => p.id) } },
        });
      }

      if (this.testFriendRequests.length > 0) {
        await this.prisma.friendRequest.deleteMany({
          where: { id: { in: this.testFriendRequests.map((r) => r.id) } },
        });
      }

      if (this.testUsers.length > 0) {
        // Remove friendships first
        for (const user of this.testUsers) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { friends: { set: [] } },
          });
        }

        await this.prisma.user.deleteMany({
          where: { id: { in: this.testUsers.map((u) => u.id) } },
        });
      }

      // Clear arrays
      this.testUsers = [];
      this.testPosts = [];
      this.testFriendRequests = [];

      console.log("✅ Test data cleaned up successfully");
    } catch (error) {
      console.error("❌ Error cleaning up test data:", error);
    }
  }

  /**
   * Assert that a user exists in database
   */
  async assertUserExists(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    return user;
  }

  /**
   * Assert that a post exists in database
   */
  async assertPostExists(postId) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new Error(`Post with ID ${postId} not found`);
    }
    return post;
  }

  /**
   * Assert that two users are friends
   */
  async assertUsersAreFriends(user1Id, user2Id) {
    const user1 = await this.prisma.user.findUnique({
      where: { id: user1Id },
      select: { friends: { select: { id: true } } },
    });

    const isFriend = user1?.friends?.some((friend) => friend.id === user2Id);
    if (!isFriend) {
      throw new Error(`Users ${user1Id} and ${user2Id} are not friends`);
    }
    return true;
  }

  /**
   * Assert that a friend request exists with specific status
   */
  async assertFriendRequestExists(senderId, receiverId, status = "pending") {
    const request = await this.prisma.friendRequest.findFirst({
      where: {
        senderId,
        receiverId,
        status,
      },
    });

    if (!request) {
      throw new Error(
        `Friend request from ${senderId} to ${receiverId} with status ${status} not found`
      );
    }
    return request;
  }

  /**
   * Get user's mutual friends
   */
  async getMutualFriends(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        friends: { select: { id: true } },
        friendOf: { select: { id: true } },
      },
    });

    const outgoingFriends = user?.friends?.map((friend) => friend.id) || [];
    const incomingFriends = user?.friendOf?.map((friend) => friend.id) || [];

    return outgoingFriends.filter((id) => incomingFriends.includes(id));
  }

  /**
   * Wait for a specified amount of time
   */
  async wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Close database connection
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

module.exports = TestUtils;
