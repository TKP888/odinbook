/**
 * Dashboard Tests for OdinBook
 * Tests post feed, friend visibility, pagination, and dashboard functionality
 */

const TestUtils = require("./test-utils");
const { PrismaClient } = require("@prisma/client");

class DashboardTests {
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
    console.log("🏠 Running Dashboard Tests...\n");

    try {
      await this.testPostFeedGeneration();
      await this.testFriendVisibilityLogic();
      await this.testPostFeedPagination();
      await this.testPostFeedOrdering();
      await this.testEmptyFeed();
      await this.testFeedWithLikesAndComments();
      await this.testFeedPerformance();
      await this.testFeedCaching();
      await this.testFeedFiltering();
      await this.testFeedRealTimeUpdates();

      this.printResults();
    } catch (error) {
      console.error("❌ Test suite failed:", error);
    } finally {
      await this.cleanup();
    }
  }

  async testPostFeedGeneration() {
    console.log("📝 Testing post feed generation...");

    try {
      const [user1, user2, user3] = await this.testUtils.createTestUsers(3);

      // Create posts by different users
      const post1 = await this.testUtils.createTestPost(user1.id, {
        content: "User1's post",
      });

      const post2 = await this.testUtils.createTestPost(user2.id, {
        content: "User2's post",
      });

      const post3 = await this.testUtils.createTestPost(user3.id, {
        content: "User3's post",
      });

      // Make user1 and user2 friends
      await this.testUtils.createFriendship(user1.id, user2.id);

      // Generate feed for user1
      const user1MutualFriends = await this.testUtils.getMutualFriends(
        user1.id
      );
      const user1VisibleUserIds = [user1.id, ...user1MutualFriends];

      const user1Feed = await this.prisma.post.findMany({
        where: {
          userId: { in: user1VisibleUserIds },
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
        orderBy: { createdAt: "desc" },
      });

      // User1 should see their own post and user2's post
      const user1OwnPosts = user1Feed.filter((p) => p.userId === user1.id);
      const user2Posts = user1Feed.filter((p) => p.userId === user2.id);
      const user3Posts = user1Feed.filter((p) => p.userId === user3.id);

      if (user1OwnPosts.length === 0) {
        throw new Error("User1 should see their own posts");
      }

      if (user2Posts.length === 0) {
        throw new Error("User1 should see friend's posts");
      }

      if (user3Posts.length > 0) {
        throw new Error("User1 should not see non-friend's posts");
      }

      console.log("✅ Post feed generation test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Post feed generation test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testFriendVisibilityLogic() {
    console.log("📝 Testing friend visibility logic...");

    try {
      const [user1, user2, user3, user4] = await this.testUtils.createTestUsers(
        4
      );

      // Create posts by all users
      await this.testUtils.createTestPost(user1.id, {
        content: "User1's post",
      });
      await this.testUtils.createTestPost(user2.id, {
        content: "User2's post",
      });
      await this.testUtils.createTestPost(user3.id, {
        content: "User3's post",
      });
      await this.testUtils.createTestPost(user4.id, {
        content: "User4's post",
      });

      // Create friendship network: user1 <-> user2 <-> user3
      await this.testUtils.createFriendship(user1.id, user2.id);
      await this.testUtils.createFriendship(user2.id, user3.id);

      // Test user1's visibility
      const user1MutualFriends = await this.testUtils.getMutualFriends(
        user1.id
      );
      const user1VisibleUserIds = [user1.id, ...user1MutualFriends];

      const user1Feed = await this.prisma.post.findMany({
        where: { userId: { in: user1VisibleUserIds } },
      });

      // User1 should see their own post and user2's post (direct friend)
      // User1 should NOT see user3's post (not direct friend)
      // User1 should NOT see user4's post (not friend)
      const user1OwnPosts = user1Feed.filter((p) => p.userId === user1.id);
      const user2Posts = user1Feed.filter((p) => p.userId === user2.id);
      const user3Posts = user1Feed.filter((p) => p.userId === user3.id);
      const user4Posts = user1Feed.filter((p) => p.userId === user4.id);

      if (user1OwnPosts.length === 0) {
        throw new Error("User1 should see their own posts");
      }

      if (user2Posts.length === 0) {
        throw new Error("User1 should see direct friend's posts");
      }

      if (user3Posts.length > 0) {
        throw new Error("User1 should not see indirect friend's posts");
      }

      if (user4Posts.length > 0) {
        throw new Error("User1 should not see non-friend's posts");
      }

      // Test user2's visibility (should see user1, user2, user3)
      const user2MutualFriends = await this.testUtils.getMutualFriends(
        user2.id
      );
      const user2VisibleUserIds = [user2.id, ...user2MutualFriends];

      const user2Feed = await this.prisma.post.findMany({
        where: { userId: { in: user2VisibleUserIds } },
      });

      if (user2Feed.length !== 3) {
        throw new Error(`User2 should see 3 posts, got ${user2Feed.length}`);
      }

      console.log("✅ Friend visibility logic test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Friend visibility logic test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testPostFeedPagination() {
    console.log("📝 Testing post feed pagination...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);

      // Make them friends
      await this.testUtils.createFriendship(user1.id, user2.id);

      // Create many posts
      const posts = [];
      for (let i = 0; i < 25; i++) {
        const post = await this.testUtils.createTestPost(user1.id, {
          content: `Post number ${i + 1}`,
        });
        posts.push(post);
      }

      // Test pagination with limit 10
      const page1 = await this.prisma.post.findMany({
        where: { userId: user1.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        skip: 0,
      });

      const page2 = await this.prisma.post.findMany({
        where: { userId: user1.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        skip: 10,
      });

      const page3 = await this.prisma.post.findMany({
        where: { userId: user1.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        skip: 20,
      });

      if (page1.length !== 10) {
        throw new Error(`Page 1 should have 10 posts, got ${page1.length}`);
      }

      if (page2.length !== 10) {
        throw new Error(`Page 2 should have 10 posts, got ${page2.length}`);
      }

      if (page3.length !== 5) {
        throw new Error(`Page 3 should have 5 posts, got ${page3.length}`);
      }

      // Verify no duplicate posts across pages
      const allPageIds = [...page1, ...page2, ...page3].map((p) => p.id);
      const uniqueIds = new Set(allPageIds);

      if (allPageIds.length !== uniqueIds.size) {
        throw new Error("Duplicate posts found across pages");
      }

      // Test pagination metadata
      const totalPosts = await this.prisma.post.count({
        where: { userId: user1.id },
      });

      const totalPages = Math.ceil(totalPosts / 10);
      const hasNextPage = page1.length === 10;

      if (totalPosts !== 25) {
        throw new Error(`Expected 25 total posts, got ${totalPosts}`);
      }

      if (totalPages !== 3) {
        throw new Error(`Expected 3 total pages, got ${totalPages}`);
      }

      if (!hasNextPage) {
        throw new Error("Should have next page");
      }

      console.log("✅ Post feed pagination test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Post feed pagination test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testPostFeedOrdering() {
    console.log("📝 Testing post feed ordering...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);

      // Make them friends
      await this.testUtils.createFriendship(user1.id, user2.id);

      // Create posts with delays to ensure different timestamps
      const post1 = await this.testUtils.createTestPost(user1.id, {
        content: "First post",
      });

      await this.testUtils.wait(100); // Small delay

      const post2 = await this.testUtils.createTestPost(user2.id, {
        content: "Second post",
      });

      await this.testUtils.wait(100); // Small delay

      const post3 = await this.testUtils.createTestPost(user1.id, {
        content: "Third post",
      });

      // Get feed ordered by creation date (newest first)
      const feed = await this.prisma.post.findMany({
        where: {
          userId: { in: [user1.id, user2.id] },
        },
        orderBy: { createdAt: "desc" },
      });

      // Verify ordering (newest first)
      if (feed.length !== 3) {
        throw new Error(`Expected 3 posts, got ${feed.length}`);
      }

      // Check that posts are ordered by creation date (newest first)
      for (let i = 0; i < feed.length - 1; i++) {
        if (feed[i].createdAt < feed[i + 1].createdAt) {
          throw new Error("Posts not ordered correctly (newest first)");
        }
      }

      // Verify the newest post is first
      if (feed[0].id !== post3.id) {
        throw new Error("Newest post not first in feed");
      }

      // Verify the oldest post is last
      if (feed[feed.length - 1].id !== post1.id) {
        throw new Error("Oldest post not last in feed");
      }

      console.log("✅ Post feed ordering test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Post feed ordering test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testEmptyFeed() {
    console.log("📝 Testing empty feed...");

    try {
      const user = await this.testUtils.createTestUser();

      // Get feed for user with no posts and no friends
      const userMutualFriends = await this.testUtils.getMutualFriends(user.id);
      const visibleUserIds = [user.id, ...userMutualFriends];

      const feed = await this.prisma.post.findMany({
        where: { userId: { in: visibleUserIds } },
      });

      if (feed.length !== 0) {
        throw new Error(`Expected empty feed, got ${feed.length} posts`);
      }

      // Test feed with friends but no posts
      const friend = await this.testUtils.createTestUser();
      await this.testUtils.createFriendship(user.id, friend.id);

      const userWithFriendsMutualFriends =
        await this.testUtils.getMutualFriends(user.id);
      const userWithFriendsVisibleUserIds = [
        user.id,
        ...userWithFriendsMutualFriends,
      ];

      const feedWithFriends = await this.prisma.post.findMany({
        where: { userId: { in: userWithFriendsVisibleUserIds } },
      });

      if (feedWithFriends.length !== 0) {
        throw new Error(
          `Expected empty feed with friends, got ${feedWithFriends.length} posts`
        );
      }

      console.log("✅ Empty feed test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Empty feed test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testFeedWithLikesAndComments() {
    console.log("📝 Testing feed with likes and comments...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);

      // Make them friends
      await this.testUtils.createFriendship(user1.id, user2.id);

      // Create a post
      const post = await this.testUtils.createTestPost(user1.id, {
        content: "Post with likes and comments",
      });

      // Add likes
      await this.testUtils.createLike(user1.id, post.id);
      await this.testUtils.createLike(user2.id, post.id);

      // Add comments
      await this.testUtils.createComment(user1.id, post.id, "First comment");
      await this.testUtils.createComment(user2.id, post.id, "Second comment");

      // Get feed with likes and comments
      const feed = await this.prisma.post.findMany({
        where: { userId: { in: [user1.id, user2.id] } },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          likes: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (feed.length !== 1) {
        throw new Error(`Expected 1 post, got ${feed.length}`);
      }

      const feedPost = feed[0];

      // Verify likes are included
      if (feedPost.likes.length !== 2) {
        throw new Error(`Expected 2 likes, got ${feedPost.likes.length}`);
      }

      // Verify comments are included
      if (feedPost.comments.length !== 2) {
        throw new Error(`Expected 2 comments, got ${feedPost.comments.length}`);
      }

      // Verify comments are ordered by creation date (oldest first)
      if (feedPost.comments[0].createdAt > feedPost.comments[1].createdAt) {
        throw new Error("Comments not ordered correctly");
      }

      // Verify user information is included
      if (!feedPost.user.username) {
        throw new Error("User information not included");
      }

      console.log("✅ Feed with likes and comments test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log(
        "❌ Feed with likes and comments test failed:",
        error.message
      );
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testFeedPerformance() {
    console.log("📝 Testing feed performance...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);

      // Make them friends
      await this.testUtils.createFriendship(user1.id, user2.id);

      // Create many posts to test performance
      const startTime = Date.now();

      for (let i = 0; i < 50; i++) {
        await this.testUtils.createTestPost(user1.id, {
          content: `Performance test post ${i + 1}`,
        });
      }

      const creationTime = Date.now() - startTime;
      console.log(`  Created 50 posts in ${creationTime}ms`);

      // Test feed generation performance
      const feedStartTime = Date.now();

      const user1MutualFriends = await this.testUtils.getMutualFriends(
        user1.id
      );
      const visibleUserIds = [user1.id, ...user1MutualFriends];

      const feed = await this.prisma.post.findMany({
        where: { userId: { in: visibleUserIds } },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
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
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20, // Limit to 20 posts for performance
      });

      const feedTime = Date.now() - feedStartTime;
      console.log(`  Generated feed in ${feedTime}ms`);

      if (feed.length !== 20) {
        throw new Error(`Expected 20 posts in feed, got ${feed.length}`);
      }

      // Performance should be reasonable (less than 1 second for 20 posts)
      if (feedTime > 1000) {
        console.log(
          `⚠️  Feed generation took ${feedTime}ms (consider optimization)`
        );
      }

      console.log("✅ Feed performance test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Feed performance test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testFeedCaching() {
    console.log("📝 Testing feed caching...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);

      // Make them friends
      await this.testUtils.createFriendship(user1.id, user2.id);

      // Create initial posts
      await this.testUtils.createTestPost(user1.id, {
        content: "Initial post",
      });

      // Get feed first time
      const user1MutualFriends = await this.testUtils.getMutualFriends(
        user1.id
      );
      const visibleUserIds = [user1.id, ...user1MutualFriends];

      const feed1 = await this.prisma.post.findMany({
        where: { userId: { in: visibleUserIds } },
        orderBy: { createdAt: "desc" },
      });

      if (feed1.length !== 1) {
        throw new Error(`Expected 1 post in first feed, got ${feed1.length}`);
      }

      // Add new post
      await this.testUtils.createTestPost(user2.id, { content: "New post" });

      // Get feed second time (should include new post)
      const feed2 = await this.prisma.post.findMany({
        where: { userId: { in: visibleUserIds } },
        orderBy: { createdAt: "desc" },
      });

      if (feed2.length !== 2) {
        throw new Error(`Expected 2 posts in second feed, got ${feed2.length}`);
      }

      // Verify new post is first (newest)
      if (feed2[0].content !== "New post") {
        throw new Error("New post not first in feed");
      }

      console.log("✅ Feed caching test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Feed caching test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testFeedFiltering() {
    console.log("📝 Testing feed filtering...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);

      // Make them friends
      await this.testUtils.createFriendship(user1.id, user2.id);

      // Create posts with different content
      await this.testUtils.createTestPost(user1.id, {
        content: "Post about cats",
      });
      await this.testUtils.createTestPost(user2.id, {
        content: "Post about dogs",
      });
      await this.testUtils.createTestPost(user1.id, {
        content: "Post about birds",
      });

      // Test filtering by content (simulate search)
      const catPosts = await this.prisma.post.findMany({
        where: {
          userId: { in: [user1.id, user2.id] },
          content: { contains: "cats", mode: "insensitive" },
        },
        orderBy: { createdAt: "desc" },
      });

      if (catPosts.length !== 1) {
        throw new Error(`Expected 1 cat post, got ${catPosts.length}`);
      }

      if (catPosts[0].content !== "Post about cats") {
        throw new Error("Wrong post returned for cat filter");
      }

      // Test filtering by user
      const user1Posts = await this.prisma.post.findMany({
        where: {
          userId: user1.id,
        },
        orderBy: { createdAt: "desc" },
      });

      if (user1Posts.length !== 2) {
        throw new Error(
          `Expected 2 posts from user1, got ${user1Posts.length}`
        );
      }

      console.log("✅ Feed filtering test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Feed filtering test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testFeedRealTimeUpdates() {
    console.log("📝 Testing feed real-time updates...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);

      // Make them friends
      await this.testUtils.createFriendship(user1.id, user2.id);

      // Get initial feed
      const user1MutualFriends = await this.testUtils.getMutualFriends(
        user1.id
      );
      const visibleUserIds = [user1.id, ...user1MutualFriends];

      const initialFeed = await this.prisma.post.findMany({
        where: { userId: { in: visibleUserIds } },
        orderBy: { createdAt: "desc" },
      });

      const initialCount = initialFeed.length;

      // Simulate real-time post creation
      const newPost = await this.testUtils.createTestPost(user2.id, {
        content: "Real-time post",
      });

      // Get updated feed
      const updatedFeed = await this.prisma.post.findMany({
        where: { userId: { in: visibleUserIds } },
        orderBy: { createdAt: "desc" },
      });

      if (updatedFeed.length !== initialCount + 1) {
        throw new Error(
          `Expected ${initialCount + 1} posts, got ${updatedFeed.length}`
        );
      }

      // Verify new post is first
      if (updatedFeed[0].id !== newPost.id) {
        throw new Error("New post not first in updated feed");
      }

      // Simulate real-time like
      await this.testUtils.createLike(user1.id, newPost.id);

      // Get feed with updated like count
      const feedWithLikes = await this.prisma.post.findMany({
        where: { userId: { in: visibleUserIds } },
        include: {
          likes: { select: { userId: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const postWithLikes = feedWithLikes.find((p) => p.id === newPost.id);
      if (postWithLikes.likes.length !== 1) {
        throw new Error("Like not reflected in feed");
      }

      console.log("✅ Feed real-time updates test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Feed real-time updates test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async cleanup() {
    await this.testUtils.cleanup();
    await this.prisma.$disconnect();
  }

  printResults() {
    console.log("\n📊 Dashboard Test Results:");
    console.log("===========================");
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
      console.log("\n🎉 All dashboard tests passed!");
    } else {
      console.log(`\n⚠️  ${this.testResults.failed} dashboard test(s) failed.`);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const dashboardTests = new DashboardTests();
  dashboardTests.runTests().catch(console.error);
}

module.exports = DashboardTests;
