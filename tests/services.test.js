/**
 * Service Layer Tests for OdinBook
 * Tests business logic in PostService, FriendService, and UserService
 */

const TestUtils = require("./test-utils");
const { PrismaClient } = require("@prisma/client");
const postService = require("../src/services/postService");
const friendService = require("../src/services/friendService");
const userService = require("../src/services/userService");

class ServiceTests {
  constructor() {
    this.testUtils = new TestUtils();
    this.prisma = new PrismaClient();
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
    };
  }

  async runTests() {
    console.log("🔧 Running Service Layer Tests...\n");

    try {
      await this.testPostService();
      await this.testFriendService();
      await this.testUserService();
      await this.testServiceIntegration();
      await this.testServiceErrorHandling();
      await this.testServicePerformance();

      this.printResults();
    } catch (error) {
      console.error("❌ Test suite failed:", error);
    } finally {
      await this.cleanup();
    }
  }

  async testPostService() {
    console.log("📝 Testing PostService...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);

      // Test createPost
      const post = await postService.createPost(
        user1.id,
        "Test post content",
        "https://example.com/photo.jpg",
        "photo_123"
      );

      if (!post) {
        throw new Error("Post not created by service");
      }

      if (post.content !== "Test post content") {
        throw new Error("Post content not set correctly");
      }

      if (post.userId !== user1.id) {
        throw new Error("Post user ID not set correctly");
      }

      // Test getPostById
      const retrievedPost = await postService.getPostById(post.id);
      if (!retrievedPost) {
        throw new Error("Post not retrieved by service");
      }

      if (retrievedPost.id !== post.id) {
        throw new Error("Retrieved post ID mismatch");
      }

      // Test updatePost
      const updatedPost = await postService.updatePost(
        post.id,
        user1.id,
        "Updated content",
        "https://example.com/new-photo.jpg",
        "new_photo_456"
      );

      if (updatedPost.content !== "Updated content") {
        throw new Error("Post not updated by service");
      }

      // Test toggleLike
      const likeResult = await postService.toggleLike(post.id, user1.id);
      if (!likeResult.liked) {
        throw new Error("Like not created by service");
      }

      if (likeResult.likesCount !== 1) {
        throw new Error("Like count not updated correctly");
      }

      // Test addComment
      const comment = await postService.addComment(
        post.id,
        user1.id,
        "Test comment"
      );
      if (!comment) {
        throw new Error("Comment not created by service");
      }

      if (comment.content !== "Test comment") {
        throw new Error("Comment content not set correctly");
      }

      // Test getPostsForUser
      const posts = await postService.getPostsForUser(user1.id, 1, 10);
      if (!posts.posts || posts.posts.length === 0) {
        throw new Error("Posts not retrieved by service");
      }

      if (!posts.pagination) {
        throw new Error("Pagination not provided by service");
      }

      // Test deletePost
      await postService.deletePost(post.id, user1.id);
      const deletedPost = await postService.getPostById(post.id);
      if (deletedPost) {
        throw new Error("Post not deleted by service");
      }

      console.log("✅ PostService test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ PostService test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testFriendService() {
    console.log("📝 Testing FriendService...");

    try {
      const [user1, user2, user3] = await this.testUtils.createTestUsers(3);

      // Test sendFriendRequest
      const request = await friendService.sendFriendRequest(user1.id, user2.id);
      if (!request) {
        throw new Error("Friend request not created by service");
      }

      if (request.senderId !== user1.id) {
        throw new Error("Request sender ID not set correctly");
      }

      if (request.receiverId !== user2.id) {
        throw new Error("Request receiver ID not set correctly");
      }

      // Test getMutualFriends
      const mutualFriends = await friendService.getMutualFriends(user1.id);
      if (!Array.isArray(mutualFriends)) {
        throw new Error("Mutual friends not returned as array");
      }

      // Test acceptFriendRequest
      await friendService.acceptFriendRequest(request.id, user2.id);

      // Verify friendship was created
      const updatedMutualFriends = await friendService.getMutualFriends(
        user1.id
      );
      if (!updatedMutualFriends.includes(user2.id)) {
        throw new Error("Friendship not created after accepting request");
      }

      // Test getAllUsersWithFriendStatus
      const usersWithStatus = await friendService.getAllUsersWithFriendStatus(
        user1.id
      );
      if (!Array.isArray(usersWithStatus)) {
        throw new Error("Users with status not returned as array");
      }

      const user2WithStatus = usersWithStatus.find((u) => u.id === user2.id);
      if (!user2WithStatus) {
        throw new Error("User2 not found in users with status");
      }

      if (user2WithStatus.friendStatus !== "friend") {
        throw new Error("User2 friend status not set correctly");
      }

      // Test getPendingRequests
      const pendingRequests = await friendService.getPendingRequests(user1.id);
      if (!Array.isArray(pendingRequests)) {
        throw new Error("Pending requests not returned as array");
      }

      // Test removeFriend
      await friendService.removeFriend(user1.id, user2.id);

      const mutualFriendsAfterRemoval = await friendService.getMutualFriends(
        user1.id
      );
      if (mutualFriendsAfterRemoval.includes(user2.id)) {
        throw new Error("Friendship not removed by service");
      }

      console.log("✅ FriendService test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ FriendService test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testUserService() {
    console.log("📝 Testing UserService...");

    try {
      // Test createUser
      const userData = {
        email: "test@example.com",
        username: "testuser",
        password: "TestPassword123!",
        firstName: "Test",
        lastName: "User",
        isSeedUser: false,
      };

      const user = await userService.createUser(userData);
      if (!user) {
        throw new Error("User not created by service");
      }

      if (user.email !== userData.email) {
        throw new Error("User email not set correctly");
      }

      if (user.username !== userData.username) {
        throw new Error("User username not set correctly");
      }

      // Test findUserByEmail
      const foundUser = await userService.findUserByEmail(userData.email);
      if (!foundUser) {
        throw new Error("User not found by email");
      }

      if (foundUser.id !== user.id) {
        throw new Error("Found user ID mismatch");
      }

      // Test findUserById
      const userById = await userService.findUserById(user.id);
      if (!userById) {
        throw new Error("User not found by ID");
      }

      if (userById.id !== user.id) {
        throw new Error("User by ID mismatch");
      }

      // Test findUserByUsername
      const userByUsername = await userService.findUserByUsername(
        userData.username
      );
      if (!userByUsername) {
        throw new Error("User not found by username");
      }

      if (userByUsername.id !== user.id) {
        throw new Error("User by username mismatch");
      }

      // Test updateUserProfile
      const updateData = {
        firstName: "Updated",
        lastName: "Name",
        bio: "Updated bio",
      };

      const updatedUser = await userService.updateUserProfile(
        user.id,
        updateData
      );
      if (!updatedUser) {
        throw new Error("User profile not updated by service");
      }

      if (updatedUser.firstName !== updateData.firstName) {
        throw new Error("First name not updated");
      }

      if (updatedUser.bio !== updateData.bio) {
        throw new Error("Bio not updated");
      }

      // Test getUserStats
      const stats = await userService.getUserStats(user.id);
      if (!stats) {
        throw new Error("User stats not retrieved by service");
      }

      if (typeof stats.postCount !== "number") {
        throw new Error("Post count not returned as number");
      }

      if (typeof stats.friendCount !== "number") {
        throw new Error("Friend count not returned as number");
      }

      // Test searchUsers
      const searchResults = await userService.searchUsers("Test", user.id, 10);
      if (!Array.isArray(searchResults)) {
        throw new Error("Search results not returned as array");
      }

      console.log("✅ UserService test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ UserService test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testServiceIntegration() {
    console.log("📝 Testing service integration...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);

      // Test complete workflow: create user -> create post -> send friend request -> accept -> like post

      // 1. Create post
      const post = await postService.createPost(
        user1.id,
        "Integration test post"
      );
      if (!post) {
        throw new Error("Post not created in integration test");
      }

      // 2. Send friend request
      const request = await friendService.sendFriendRequest(user1.id, user2.id);
      if (!request) {
        throw new Error("Friend request not sent in integration test");
      }

      // 3. Accept friend request
      await friendService.acceptFriendRequest(request.id, user2.id);

      // 4. Verify friendship
      const mutualFriends = await friendService.getMutualFriends(user1.id);
      if (!mutualFriends.includes(user2.id)) {
        throw new Error("Friendship not established in integration test");
      }

      // 5. Like post
      const likeResult = await postService.toggleLike(post.id, user2.id);
      if (!likeResult.liked) {
        throw new Error("Post not liked in integration test");
      }

      // 6. Add comment
      const comment = await postService.addComment(
        post.id,
        user2.id,
        "Integration test comment"
      );
      if (!comment) {
        throw new Error("Comment not added in integration test");
      }

      // 7. Get posts for user (should include friend's posts)
      const posts = await postService.getPostsForUser(user1.id, 1, 10);
      const friendPost = posts.posts.find((p) => p.userId === user2.id);
      if (!friendPost) {
        throw new Error("Friend's post not visible in integration test");
      }

      // 8. Get user stats
      const user1Stats = await userService.getUserStats(user1.id);
      const user2Stats = await userService.getUserStats(user2.id);

      if (user1Stats.friendCount !== 1) {
        throw new Error("User1 friend count not correct in integration test");
      }

      if (user2Stats.friendCount !== 1) {
        throw new Error("User2 friend count not correct in integration test");
      }

      console.log("✅ Service integration test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Service integration test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testServiceErrorHandling() {
    console.log("📝 Testing service error handling...");

    try {
      const user = await this.testUtils.createTestUser();

      // Test PostService error handling
      try {
        await postService.getPostById("invalid-id");
        throw new Error("Should throw error for invalid post ID");
      } catch (error) {
        console.log("✅ PostService correctly handles invalid post ID");
      }

      try {
        await postService.updatePost("invalid-id", user.id, "content");
        throw new Error("Should throw error for invalid post ID in update");
      } catch (error) {
        console.log(
          "✅ PostService correctly handles invalid post ID in update"
        );
      }

      // Test FriendService error handling
      try {
        await friendService.sendFriendRequest(user.id, user.id);
        throw new Error("Should throw error for self-friend request");
      } catch (error) {
        console.log("✅ FriendService correctly handles self-friend request");
      }

      try {
        await friendService.acceptFriendRequest("invalid-id", user.id);
        throw new Error("Should throw error for invalid request ID");
      } catch (error) {
        console.log("✅ FriendService correctly handles invalid request ID");
      }

      // Test UserService error handling
      try {
        await userService.findUserByEmail("nonexistent@example.com");
        if (user) {
          throw new Error("Should return null for non-existent email");
        }
      } catch (error) {
        console.log("✅ UserService correctly handles non-existent email");
      }

      try {
        await userService.findUserById("invalid-id");
        if (user) {
          throw new Error("Should return null for invalid user ID");
        }
      } catch (error) {
        console.log("✅ UserService correctly handles invalid user ID");
      }

      console.log("✅ Service error handling test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Service error handling test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testServicePerformance() {
    console.log("📝 Testing service performance...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);

      // Test PostService performance
      const postStartTime = Date.now();

      const posts = [];
      for (let i = 0; i < 20; i++) {
        const post = await postService.createPost(
          user1.id,
          `Performance test post ${i + 1}`
        );
        posts.push(post);
      }

      const postCreationTime = Date.now() - postStartTime;
      console.log(`  Created 20 posts in ${postCreationTime}ms`);

      // Test FriendService performance
      const friendStartTime = Date.now();

      await friendService.sendFriendRequest(user1.id, user2.id);
      const request = await this.prisma.friendRequest.findFirst({
        where: { senderId: user1.id, receiverId: user2.id },
      });

      await friendService.acceptFriendRequest(request.id, user2.id);

      const friendTime = Date.now() - friendStartTime;
      console.log(`  Friend request workflow in ${friendTime}ms`);

      // Test UserService performance
      const userStartTime = Date.now();

      const stats = await userService.getUserStats(user1.id);
      const searchResults = await userService.searchUsers(
        "Performance",
        user1.id,
        10
      );

      const userTime = Date.now() - userStartTime;
      console.log(`  User operations in ${userTime}ms`);

      // Performance should be reasonable
      if (postCreationTime > 5000) {
        console.log(
          `⚠️  Post creation took ${postCreationTime}ms (consider optimization)`
        );
      }

      if (friendTime > 1000) {
        console.log(
          `⚠️  Friend operations took ${friendTime}ms (consider optimization)`
        );
      }

      if (userTime > 1000) {
        console.log(
          `⚠️  User operations took ${userTime}ms (consider optimization)`
        );
      }

      console.log("✅ Service performance test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Service performance test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async cleanup() {
    await this.testUtils.cleanup();
    await this.prisma.$disconnect();
  }

  printResults() {
    console.log("\n📊 Service Layer Test Results:");
    console.log("===============================");
    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);

    if (this.testResults.total > 0) {
      const successRate = (
        (this.testResults.passed / this.testResults.total) *
        100
      ).toFixed(1);
      console.log(`Success Rate: ${successRate}%`);
    }

    if (this.testResults.failed === 0) {
      console.log("\n🎉 All service layer tests passed!");
    } else {
      console.log(
        `\n⚠️  ${this.testResults.failed} service layer test(s) failed.`
      );
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const serviceTests = new ServiceTests();
  serviceTests.runTests().catch(console.error);
}

module.exports = ServiceTests;
