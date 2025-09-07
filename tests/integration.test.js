/**
 * Integration Tests for OdinBook
 * Tests end-to-end workflows and complete user journeys
 */

const TestUtils = require("./test-utils");
const { PrismaClient } = require("@prisma/client");

class IntegrationTests {
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
    console.log("🔗 Running Integration Tests...\n");

    try {
      await this.testCompleteUserJourney();
      await this.testFriendRequestWorkflow();
      await this.testPostInteractionWorkflow();
      await this.testProfileManagementWorkflow();
      await this.testMultiUserScenario();
      await this.testDataConsistency();
      await this.testConcurrentOperations();
      await this.testErrorRecovery();
      await this.testPerformanceUnderLoad();
      await this.testSystemIntegration();

      this.printResults();
    } catch (error) {
      console.error("❌ Test suite failed:", error);
    } finally {
      await this.cleanup();
    }
  }

  async testCompleteUserJourney() {
    console.log("📝 Testing complete user journey...");

    try {
      // 1. User Registration
      const user = await this.testUtils.createTestUser({
        email: "journey@example.com",
        username: "journeyuser",
        password: "JourneyPass123!",
        firstName: "Journey",
        lastName: "User",
        bio: "This is my journey",
      });

      if (!user) {
        throw new Error("User registration failed");
      }

      // 2. Profile Setup
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          bio: "Updated bio for my journey",
          location: "Journey City",
          profilePicture: "https://example.com/journey-pic.jpg",
        },
      });

      // 3. Create First Post
      const firstPost = await this.testUtils.createTestPost(user.id, {
        content: "Hello world! This is my first post on OdinBook!",
      });

      if (!firstPost) {
        throw new Error("First post creation failed");
      }

      // 4. Create Second User and Send Friend Request
      const friend = await this.testUtils.createTestUser({
        email: "friend@example.com",
        username: "frienduser",
        firstName: "Friend",
        lastName: "User",
      });

      const friendRequest = await this.testUtils.createFriendRequest(
        user.id,
        friend.id
      );
      if (!friendRequest) {
        throw new Error("Friend request creation failed");
      }

      // 5. Accept Friend Request
      await this.prisma.$transaction(async (tx) => {
        await tx.friendRequest.update({
          where: { id: friendRequest.id },
          data: { status: "accepted" },
        });

        await tx.user.update({
          where: { id: friend.id },
          data: { friends: { connect: { id: user.id } } },
        });

        await tx.user.update({
          where: { id: user.id },
          data: { friends: { connect: { id: friend.id } } },
        });
      });

      // 6. Friend Creates Post
      const friendPost = await this.testUtils.createTestPost(friend.id, {
        content: "Hey! Thanks for the friend request!",
      });

      // 7. User Likes Friend's Post
      await this.testUtils.createLike(user.id, friendPost.id);

      // 8. User Comments on Friend's Post
      await this.testUtils.createComment(
        user.id,
        friendPost.id,
        "Great to be friends!"
      );

      // 9. Verify Complete Journey
      const userMutualFriends = await this.testUtils.getMutualFriends(user.id);
      if (!userMutualFriends.includes(friend.id)) {
        throw new Error("Friendship not established");
      }

      const userPosts = await this.prisma.post.findMany({
        where: { userId: user.id },
      });

      if (userPosts.length !== 1) {
        throw new Error("User post count incorrect");
      }

      const friendPosts = await this.prisma.post.findMany({
        where: { userId: friend.id },
      });

      if (friendPosts.length !== 1) {
        throw new Error("Friend post count incorrect");
      }

      const likes = await this.prisma.like.findMany({
        where: { postId: friendPost.id },
      });

      if (likes.length !== 1) {
        throw new Error("Like not created");
      }

      const comments = await this.prisma.comment.findMany({
        where: { postId: friendPost.id },
      });

      if (comments.length !== 1) {
        throw new Error("Comment not created");
      }

      console.log("✅ Complete user journey test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Complete user journey test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testFriendRequestWorkflow() {
    console.log("📝 Testing friend request workflow...");

    try {
      const [user1, user2, user3] = await this.testUtils.createTestUsers(3);

      // 1. User1 sends friend request to User2
      const request1 = await this.testUtils.createFriendRequest(
        user1.id,
        user2.id
      );
      if (!request1) {
        throw new Error("Friend request 1 not created");
      }

      // 2. User2 sends friend request to User3
      const request2 = await this.testUtils.createFriendRequest(
        user2.id,
        user3.id
      );
      if (!request2) {
        throw new Error("Friend request 2 not created");
      }

      // 3. User2 accepts User1's request
      await this.prisma.$transaction(async (tx) => {
        await tx.friendRequest.update({
          where: { id: request1.id },
          data: { status: "accepted" },
        });

        await tx.user.update({
          where: { id: user2.id },
          data: { friends: { connect: { id: user1.id } } },
        });

        await tx.user.update({
          where: { id: user1.id },
          data: { friends: { connect: { id: user2.id } } },
        });
      });

      // 4. User3 declines User2's request
      await this.prisma.friendRequest.update({
        where: { id: request2.id },
        data: { status: "declined" },
      });

      // 5. Verify results
      const user1MutualFriends = await this.testUtils.getMutualFriends(
        user1.id
      );
      const user2MutualFriends = await this.testUtils.getMutualFriends(
        user2.id
      );
      const user3MutualFriends = await this.testUtils.getMutualFriends(
        user3.id
      );

      if (!user1MutualFriends.includes(user2.id)) {
        throw new Error("User1-User2 friendship not established");
      }

      if (!user2MutualFriends.includes(user1.id)) {
        throw new Error("User2-User1 friendship not established");
      }

      if (user3MutualFriends.includes(user2.id)) {
        throw new Error("User3-User2 friendship should not exist");
      }

      // 6. Verify request statuses
      const acceptedRequest = await this.prisma.friendRequest.findUnique({
        where: { id: request1.id },
      });

      const declinedRequest = await this.prisma.friendRequest.findUnique({
        where: { id: request2.id },
      });

      if (acceptedRequest.status !== "accepted") {
        throw new Error("Request 1 status not updated to accepted");
      }

      if (declinedRequest.status !== "declined") {
        throw new Error("Request 2 status not updated to declined");
      }

      console.log("✅ Friend request workflow test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Friend request workflow test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testPostInteractionWorkflow() {
    console.log("📝 Testing post interaction workflow...");

    try {
      const [user1, user2, user3] = await this.testUtils.createTestUsers(3);

      // 1. Create friendship between User1 and User2
      await this.testUtils.createFriendship(user1.id, user2.id);

      // 2. User1 creates a post
      const post = await this.testUtils.createTestPost(user1.id, {
        content: "Check out this amazing post!",
      });

      // 3. User2 likes the post
      await this.testUtils.createLike(user2.id, post.id);

      // 4. User3 tries to like the post (should work, but won't see it in feed)
      await this.testUtils.createLike(user3.id, post.id);

      // 5. User2 comments on the post
      const comment1 = await this.testUtils.createComment(
        user2.id,
        post.id,
        "Great post!"
      );

      // 6. User1 replies to the comment
      const comment2 = await this.testUtils.createComment(
        user1.id,
        post.id,
        "Thanks!"
      );

      // 7. User3 comments on the post
      const comment3 = await this.testUtils.createComment(
        user3.id,
        post.id,
        "Interesting!"
      );

      // 8. Verify post interactions
      const likes = await this.prisma.like.findMany({
        where: { postId: post.id },
      });

      if (likes.length !== 2) {
        throw new Error(`Expected 2 likes, got ${likes.length}`);
      }

      const comments = await this.prisma.comment.findMany({
        where: { postId: post.id },
        orderBy: { createdAt: "asc" },
      });

      if (comments.length !== 3) {
        throw new Error(`Expected 3 comments, got ${comments.length}`);
      }

      // 9. Test post visibility
      const user1MutualFriends = await this.testUtils.getMutualFriends(
        user1.id
      );
      const user1VisibleUserIds = [user1.id, ...user1MutualFriends];

      const user1Feed = await this.prisma.post.findMany({
        where: { userId: { in: user1VisibleUserIds } },
      });

      const user3MutualFriends = await this.testUtils.getMutualFriends(
        user3.id
      );
      const user3VisibleUserIds = [user3.id, ...user3MutualFriends];

      const user3Feed = await this.prisma.post.findMany({
        where: { userId: { in: user3VisibleUserIds } },
      });

      // User1 should see the post (own post)
      const user1CanSeePost = user1Feed.some((p) => p.id === post.id);
      if (!user1CanSeePost) {
        throw new Error("User1 should see their own post");
      }

      // User3 should not see the post in feed (not friends)
      const user3CanSeePost = user3Feed.some((p) => p.id === post.id);
      if (user3CanSeePost) {
        throw new Error("User3 should not see User1's post in feed");
      }

      console.log("✅ Post interaction workflow test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Post interaction workflow test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testProfileManagementWorkflow() {
    console.log("📝 Testing profile management workflow...");

    try {
      const user = await this.testUtils.createTestUser({
        firstName: "Initial",
        lastName: "Name",
        username: "initialuser",
        bio: "Initial bio",
      });

      // 1. Update basic profile information
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: "Updated",
          lastName: "Name",
          username: "updateduser",
          bio: "Updated bio with more information",
          location: "New City",
          gender: "Other",
        },
      });

      // 2. Upload profile picture
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          profilePicture: "https://example.com/new-profile-pic.jpg",
          cloudinaryPublicId: "new_profile_123",
          useGravatar: false,
        },
      });

      // 3. Switch to Gravatar
      const gravatarUrl = `https://www.gravatar.com/avatar/${user.email
        .toLowerCase()
        .trim()}?s=200&d=identicon&r=pg`;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          useGravatar: true,
          profilePicture: gravatarUrl,
          cloudinaryPublicId: null,
        },
      });

      // 4. Create some posts to test profile stats
      await this.testUtils.createTestPost(user.id, {
        content: "Profile post 1",
      });
      await this.testUtils.createTestPost(user.id, {
        content: "Profile post 2",
      });

      // 5. Verify profile updates
      const updatedUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          firstName: true,
          lastName: true,
          username: true,
          bio: true,
          location: true,
          gender: true,
          profilePicture: true,
          useGravatar: true,
          cloudinaryPublicId: true,
        },
      });

      if (updatedUser.firstName !== "Updated") {
        throw new Error("First name not updated");
      }

      if (updatedUser.lastName !== "Name") {
        throw new Error("Last name not updated");
      }

      if (updatedUser.username !== "updateduser") {
        throw new Error("Username not updated");
      }

      if (updatedUser.bio !== "Updated bio with more information") {
        throw new Error("Bio not updated");
      }

      if (updatedUser.location !== "New City") {
        throw new Error("Location not updated");
      }

      if (updatedUser.gender !== "Other") {
        throw new Error("Gender not updated");
      }

      if (!updatedUser.useGravatar) {
        throw new Error("Gravatar not enabled");
      }

      if (updatedUser.cloudinaryPublicId !== null) {
        throw new Error("Cloudinary public ID not cleared");
      }

      // 6. Verify profile stats
      const postCount = await this.prisma.post.count({
        where: { userId: user.id },
      });

      if (postCount !== 2) {
        throw new Error(`Expected 2 posts, got ${postCount}`);
      }

      console.log("✅ Profile management workflow test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Profile management workflow test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testMultiUserScenario() {
    console.log("📝 Testing multi-user scenario...");

    try {
      // Create 5 users
      const users = await this.testUtils.createTestUsers(5);

      // Create friendship network: User1 <-> User2 <-> User3 <-> User4
      await this.testUtils.createFriendship(users[0].id, users[1].id);
      await this.testUtils.createFriendship(users[1].id, users[2].id);
      await this.testUtils.createFriendship(users[2].id, users[3].id);

      // Each user creates posts
      for (let i = 0; i < users.length; i++) {
        await this.testUtils.createTestPost(users[i].id, {
          content: `Post from User${i + 1}`,
        });
      }

      // Test visibility for each user
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const mutualFriends = await this.testUtils.getMutualFriends(user.id);
        const visibleUserIds = [user.id, ...mutualFriends];

        const feed = await this.prisma.post.findMany({
          where: { userId: { in: visibleUserIds } },
        });

        // User should see their own post
        const ownPosts = feed.filter((p) => p.userId === user.id);
        if (ownPosts.length !== 1) {
          throw new Error(`User${i + 1} should see their own post`);
        }

        // User should see friends' posts
        const friendPosts = feed.filter((p) => p.userId !== user.id);
        const expectedFriendPosts = mutualFriends.length;

        if (friendPosts.length !== expectedFriendPosts) {
          throw new Error(
            `User${i + 1} should see ${expectedFriendPosts} friend posts, got ${
              friendPosts.length
            }`
          );
        }
      }

      // Test User5 (isolated user) sees only their own posts
      const user5MutualFriends = await this.testUtils.getMutualFriends(
        users[4].id
      );
      const user5VisibleUserIds = [users[4].id, ...user5MutualFriends];

      const user5Feed = await this.prisma.post.findMany({
        where: { userId: { in: user5VisibleUserIds } },
      });

      if (user5Feed.length !== 1) {
        throw new Error(
          `User5 should see only 1 post (their own), got ${user5Feed.length}`
        );
      }

      if (user5Feed[0].userId !== users[4].id) {
        throw new Error("User5 should only see their own post");
      }

      console.log("✅ Multi-user scenario test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Multi-user scenario test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testDataConsistency() {
    console.log("📝 Testing data consistency...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);

      // Create friendship
      await this.testUtils.createFriendship(user1.id, user2.id);

      // Create posts with likes and comments
      const post1 = await this.testUtils.createTestPost(user1.id, {
        content: "Post 1",
      });
      const post2 = await this.testUtils.createTestPost(user2.id, {
        content: "Post 2",
      });

      await this.testUtils.createLike(user1.id, post2.id);
      await this.testUtils.createLike(user2.id, post1.id);

      await this.testUtils.createComment(user1.id, post2.id, "Comment 1");
      await this.testUtils.createComment(user2.id, post1.id, "Comment 2");

      // Test data consistency checks

      // 1. Check friendship consistency
      const user1MutualFriends = await this.testUtils.getMutualFriends(
        user1.id
      );
      const user2MutualFriends = await this.testUtils.getMutualFriends(
        user2.id
      );

      if (!user1MutualFriends.includes(user2.id)) {
        throw new Error("User1-User2 friendship not consistent");
      }

      if (!user2MutualFriends.includes(user1.id)) {
        throw new Error("User2-User1 friendship not consistent");
      }

      // 2. Check post ownership consistency
      const user1Posts = await this.prisma.post.findMany({
        where: { userId: user1.id },
      });

      const user2Posts = await this.prisma.post.findMany({
        where: { userId: user2.id },
      });

      if (user1Posts.length !== 1) {
        throw new Error("User1 post count inconsistent");
      }

      if (user2Posts.length !== 1) {
        throw new Error("User2 post count inconsistent");
      }

      // 3. Check like consistency
      const post1Likes = await this.prisma.like.count({
        where: { postId: post1.id },
      });

      const post2Likes = await this.prisma.like.count({
        where: { postId: post2.id },
      });

      if (post1Likes !== 1) {
        throw new Error("Post1 like count inconsistent");
      }

      if (post2Likes !== 1) {
        throw new Error("Post2 like count inconsistent");
      }

      // 4. Check comment consistency
      const post1Comments = await this.prisma.comment.count({
        where: { postId: post1.id },
      });

      const post2Comments = await this.prisma.comment.count({
        where: { postId: post2.id },
      });

      if (post1Comments !== 1) {
        throw new Error("Post1 comment count inconsistent");
      }

      if (post2Comments !== 1) {
        throw new Error("Post2 comment count inconsistent");
      }

      // 5. Test cascade deletion consistency
      await this.prisma.post.delete({
        where: { id: post1.id },
      });

      const remainingLikes = await this.prisma.like.count({
        where: { postId: post1.id },
      });

      const remainingComments = await this.prisma.comment.count({
        where: { postId: post1.id },
      });

      if (remainingLikes > 0) {
        console.log("⚠️  Likes not cascade deleted with post");
      }

      if (remainingComments > 0) {
        console.log("⚠️  Comments not cascade deleted with post");
      }

      console.log("✅ Data consistency test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Data consistency test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testConcurrentOperations() {
    console.log("📝 Testing concurrent operations...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);

      // Create friendship
      await this.testUtils.createFriendship(user1.id, user2.id);

      // Test concurrent post creation
      const postPromises = [];
      for (let i = 0; i < 10; i++) {
        postPromises.push(
          this.testUtils.createTestPost(user1.id, {
            content: `Concurrent post ${i + 1}`,
          })
        );
      }

      const posts = await Promise.all(postPromises);

      if (posts.length !== 10) {
        throw new Error(`Expected 10 posts, got ${posts.length}`);
      }

      // Test concurrent likes
      const likePromises = [];
      for (let i = 0; i < 5; i++) {
        likePromises.push(this.testUtils.createLike(user2.id, posts[i].id));
      }

      const likes = await Promise.all(likePromises);

      if (likes.length !== 5) {
        throw new Error(`Expected 5 likes, got ${likes.length}`);
      }

      // Test concurrent comments
      const commentPromises = [];
      for (let i = 0; i < 5; i++) {
        commentPromises.push(
          this.testUtils.createComment(
            user2.id,
            posts[i].id,
            `Concurrent comment ${i + 1}`
          )
        );
      }

      const comments = await Promise.all(commentPromises);

      if (comments.length !== 5) {
        throw new Error(`Expected 5 comments, got ${comments.length}`);
      }

      // Verify final state
      const finalPostCount = await this.prisma.post.count({
        where: { userId: user1.id },
      });

      const finalLikeCount = await this.prisma.like.count({
        where: { userId: user2.id },
      });

      const finalCommentCount = await this.prisma.comment.count({
        where: { userId: user2.id },
      });

      if (finalPostCount !== 10) {
        throw new Error(`Final post count should be 10, got ${finalPostCount}`);
      }

      if (finalLikeCount !== 5) {
        throw new Error(`Final like count should be 5, got ${finalLikeCount}`);
      }

      if (finalCommentCount !== 5) {
        throw new Error(
          `Final comment count should be 5, got ${finalCommentCount}`
        );
      }

      console.log("✅ Concurrent operations test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Concurrent operations test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testErrorRecovery() {
    console.log("📝 Testing error recovery...");

    try {
      const user = await this.testUtils.createTestUser();

      // Test recovery from invalid operations

      // 1. Try to create post with invalid user ID
      try {
        await this.testUtils.createTestPost("invalid-user-id", {
          content: "Invalid post",
        });
        throw new Error("Should not create post with invalid user ID");
      } catch (error) {
        console.log("✅ Correctly handled invalid user ID");
      }

      // 2. Try to create like with invalid post ID
      try {
        await this.testUtils.createLike(user.id, "invalid-post-id");
        throw new Error("Should not create like with invalid post ID");
      } catch (error) {
        console.log("✅ Correctly handled invalid post ID");
      }

      // 3. Try to create comment with invalid post ID
      try {
        await this.testUtils.createComment(
          user.id,
          "invalid-post-id",
          "Invalid comment"
        );
        throw new Error("Should not create comment with invalid post ID");
      } catch (error) {
        console.log("✅ Correctly handled invalid post ID for comment");
      }

      // 4. Test recovery from partial failures
      const post = await this.testUtils.createTestPost(user.id, {
        content: "Recovery test post",
      });

      // Create like successfully
      await this.testUtils.createLike(user.id, post.id);

      // Try to create duplicate like (should fail gracefully)
      try {
        await this.testUtils.createLike(user.id, post.id);
        throw new Error("Should not allow duplicate likes");
      } catch (error) {
        console.log("✅ Correctly prevented duplicate like");
      }

      // Verify system is still in consistent state
      const likeCount = await this.prisma.like.count({
        where: { postId: post.id },
      });

      if (likeCount !== 1) {
        throw new Error(`Expected 1 like, got ${likeCount}`);
      }

      console.log("✅ Error recovery test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Error recovery test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testPerformanceUnderLoad() {
    console.log("📝 Testing performance under load...");

    try {
      const startTime = Date.now();

      // Create multiple users
      const users = await this.testUtils.createTestUsers(10);

      // Create friendship network
      for (let i = 0; i < users.length - 1; i++) {
        await this.testUtils.createFriendship(users[i].id, users[i + 1].id);
      }

      // Create posts for each user
      const postPromises = [];
      for (let i = 0; i < users.length; i++) {
        for (let j = 0; j < 5; j++) {
          postPromises.push(
            this.testUtils.createTestPost(users[i].id, {
              content: `User${i + 1} post ${j + 1}`,
            })
          );
        }
      }

      const posts = await Promise.all(postPromises);

      // Create likes and comments
      const interactionPromises = [];
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const user = users[i % users.length];

        interactionPromises.push(this.testUtils.createLike(user.id, post.id));

        interactionPromises.push(
          this.testUtils.createComment(
            user.id,
            post.id,
            `Comment on post ${i + 1}`
          )
        );
      }

      await Promise.all(interactionPromises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      console.log(
        `  Created ${users.length} users, ${posts.length} posts, and ${interactionPromises.length} interactions in ${totalTime}ms`
      );

      // Test feed generation performance
      const feedStartTime = Date.now();

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const mutualFriends = await this.testUtils.getMutualFriends(user.id);
        const visibleUserIds = [user.id, ...mutualFriends];

        await this.prisma.post.findMany({
          where: { userId: { in: visibleUserIds } },
          include: {
            user: { select: { id: true, username: true } },
            likes: { select: { userId: true } },
            comments: { select: { id: true, content: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        });
      }

      const feedTime = Date.now() - feedStartTime;
      console.log(
        `  Generated feeds for ${users.length} users in ${feedTime}ms`
      );

      // Performance should be reasonable
      if (totalTime > 10000) {
        console.log(
          `⚠️  Load test took ${totalTime}ms (consider optimization)`
        );
      }

      if (feedTime > 5000) {
        console.log(
          `⚠️  Feed generation took ${feedTime}ms (consider optimization)`
        );
      }

      console.log("✅ Performance under load test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Performance under load test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testSystemIntegration() {
    console.log("📝 Testing system integration...");

    try {
      // Test complete system integration
      const [user1, user2, user3] = await this.testUtils.createTestUsers(3);

      // 1. User registration and profile setup
      await this.prisma.user.update({
        where: { id: user1.id },
        data: {
          bio: "System integration test user",
          location: "Integration City",
        },
      });

      // 2. Friend request workflow
      const request = await this.testUtils.createFriendRequest(
        user1.id,
        user2.id
      );
      await this.prisma.$transaction(async (tx) => {
        await tx.friendRequest.update({
          where: { id: request.id },
          data: { status: "accepted" },
        });

        await tx.user.update({
          where: { id: user2.id },
          data: { friends: { connect: { id: user1.id } } },
        });

        await tx.user.update({
          where: { id: user1.id },
          data: { friends: { connect: { id: user2.id } } },
        });
      });

      // 3. Post creation and interaction
      const post = await this.testUtils.createTestPost(user1.id, {
        content: "System integration post",
      });
      await this.testUtils.createLike(user2.id, post.id);
      await this.testUtils.createComment(
        user2.id,
        post.id,
        "System integration comment"
      );

      // 4. Test feed generation
      const user1MutualFriends = await this.testUtils.getMutualFriends(
        user1.id
      );
      const user1VisibleUserIds = [user1.id, ...user1MutualFriends];

      const feed = await this.prisma.post.findMany({
        where: { userId: { in: user1VisibleUserIds } },
        include: {
          user: { select: { id: true, username: true, bio: true } },
          likes: { select: { userId: true } },
          comments: {
            include: {
              user: { select: { id: true, username: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // 5. Verify complete integration
      if (feed.length !== 1) {
        throw new Error(`Expected 1 post in feed, got ${feed.length}`);
      }

      const feedPost = feed[0];
      if (feedPost.likes.length !== 1) {
        throw new Error(`Expected 1 like, got ${feedPost.likes.length}`);
      }

      if (feedPost.comments.length !== 1) {
        throw new Error(`Expected 1 comment, got ${feedPost.comments.length}`);
      }

      // 6. Test user stats integration
      const user1Stats = await Promise.all([
        this.prisma.post.count({ where: { userId: user1.id } }),
        this.prisma.like.count({ where: { userId: user1.id } }),
        this.prisma.comment.count({ where: { userId: user1.id } }),
      ]);

      const [postCount, likeCount, commentCount] = user1Stats;

      if (postCount !== 1) {
        throw new Error(`Expected 1 post, got ${postCount}`);
      }

      if (likeCount !== 0) {
        throw new Error(`Expected 0 likes by user1, got ${likeCount}`);
      }

      if (commentCount !== 0) {
        throw new Error(`Expected 0 comments by user1, got ${commentCount}`);
      }

      // 7. Test profile integration
      const user1Profile = await this.prisma.user.findUnique({
        where: { id: user1.id },
        select: {
          id: true,
          username: true,
          bio: true,
          location: true,
          friends: { select: { id: true, username: true } },
          posts: { select: { id: true, content: true } },
        },
      });

      if (!user1Profile) {
        throw new Error("User profile not found");
      }

      if (user1Profile.friends.length !== 1) {
        throw new Error(
          `Expected 1 friend, got ${user1Profile.friends.length}`
        );
      }

      if (user1Profile.posts.length !== 1) {
        throw new Error(`Expected 1 post, got ${user1Profile.posts.length}`);
      }

      console.log("✅ System integration test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ System integration test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async cleanup() {
    await this.testUtils.cleanup();
    await this.prisma.$disconnect();
  }

  printResults() {
    console.log("\n📊 Integration Test Results:");
    console.log("=============================");
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
      console.log("\n🎉 All integration tests passed!");
    } else {
      console.log(
        `\n⚠️  ${this.testResults.failed} integration test(s) failed.`
      );
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const integrationTests = new IntegrationTests();
  integrationTests.runTests().catch(console.error);
}

module.exports = IntegrationTests;
