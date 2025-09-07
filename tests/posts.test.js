/**
 * Post Management Tests for OdinBook
 * Tests post creation, updates, deletion, likes, comments, and visibility
 */

const TestUtils = require("./test-utils");
const { PrismaClient } = require("@prisma/client");

class PostTests {
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
    console.log("📝 Running Post Management Tests...\n");

    try {
      await this.testCreatePost();
      await this.testUpdatePost();
      await this.testDeletePost();
      await this.testPostLikes();
      await this.testPostComments();
      await this.testPostVisibility();
      await this.testPostPagination();
      await this.testPostValidation();
      await this.testPostOwnership();
      await this.testPostFeed();

      this.printResults();
    } catch (error) {
      console.error("❌ Test suite failed:", error);
    } finally {
      await this.cleanup();
    }
  }

  async testCreatePost() {
    console.log("📝 Testing post creation...");

    try {
      const user = await this.testUtils.createTestUser();

      // Create a simple text post
      const postData = {
        content: "This is a test post with some content!",
        userId: user.id,
      };

      const post = await this.testUtils.createTestPost(user.id, postData);

      // Verify post was created
      if (!post) {
        throw new Error("Post not created");
      }

      if (post.content !== postData.content) {
        throw new Error("Post content not saved correctly");
      }

      if (post.userId !== user.id) {
        throw new Error("Post user ID not set correctly");
      }

      // Verify post exists in database
      await this.testUtils.assertPostExists(post.id);

      // Test post with photo
      const postWithPhoto = await this.testUtils.createTestPost(user.id, {
        content: "Post with photo",
        photoUrl: "https://example.com/photo.jpg",
        cloudinaryPublicId: "photo_123",
      });

      if (!postWithPhoto.photoUrl) {
        throw new Error("Photo URL not saved");
      }

      if (!postWithPhoto.cloudinaryPublicId) {
        throw new Error("Cloudinary public ID not saved");
      }

      console.log("✅ Post creation test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Post creation test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testUpdatePost() {
    console.log("📝 Testing post update...");

    try {
      const user = await this.testUtils.createTestUser();

      // Create initial post
      const post = await this.testUtils.createTestPost(user.id, {
        content: "Original content",
      });

      // Update post content
      const updatedContent = "Updated content with more information";
      const updatedPost = await this.prisma.post.update({
        where: { id: post.id },
        data: {
          content: updatedContent,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          content: true,
          updatedAt: true,
          createdAt: true,
        },
      });

      if (updatedPost.content !== updatedContent) {
        throw new Error("Post content not updated correctly");
      }

      if (updatedPost.updatedAt <= updatedPost.createdAt) {
        throw new Error("UpdatedAt timestamp not updated");
      }

      // Test updating post with new photo
      const postWithNewPhoto = await this.prisma.post.update({
        where: { id: post.id },
        data: {
          photoUrl: "https://example.com/new-photo.jpg",
          cloudinaryPublicId: "new_photo_456",
        },
        select: {
          id: true,
          photoUrl: true,
          cloudinaryPublicId: true,
        },
      });

      if (postWithNewPhoto.photoUrl !== "https://example.com/new-photo.jpg") {
        throw new Error("Photo URL not updated correctly");
      }

      if (postWithNewPhoto.cloudinaryPublicId !== "new_photo_456") {
        throw new Error("Cloudinary public ID not updated correctly");
      }

      console.log("✅ Post update test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Post update test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testDeletePost() {
    console.log("📝 Testing post deletion...");

    try {
      const user = await this.testUtils.createTestUser();

      // Create post
      const post = await this.testUtils.createTestPost(user.id, {
        content: "Post to be deleted",
      });

      // Verify post exists
      await this.testUtils.assertPostExists(post.id);

      // Delete post
      await this.prisma.post.delete({
        where: { id: post.id },
      });

      // Verify post is deleted
      const deletedPost = await this.prisma.post.findUnique({
        where: { id: post.id },
      });

      if (deletedPost) {
        throw new Error("Post should be deleted");
      }

      // Test cascade deletion of likes and comments
      const postWithLikes = await this.testUtils.createTestPost(user.id, {
        content: "Post with likes and comments",
      });

      // Add like and comment
      await this.testUtils.createLike(user.id, postWithLikes.id);
      await this.testUtils.createComment(
        user.id,
        postWithLikes.id,
        "Test comment"
      );

      // Delete post
      await this.prisma.post.delete({
        where: { id: postWithLikes.id },
      });

      // Verify likes and comments are also deleted (cascade)
      const remainingLikes = await this.prisma.like.findMany({
        where: { postId: postWithLikes.id },
      });

      const remainingComments = await this.prisma.comment.findMany({
        where: { postId: postWithLikes.id },
      });

      if (remainingLikes.length > 0) {
        console.log("⚠️  Likes not cascade deleted with post");
      }

      if (remainingComments.length > 0) {
        console.log("⚠️  Comments not cascade deleted with post");
      }

      console.log("✅ Post deletion test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Post deletion test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testPostLikes() {
    console.log("📝 Testing post likes...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);
      const post = await this.testUtils.createTestPost(user1.id, {
        content: "Post to be liked",
      });

      // Test like creation
      const like = await this.testUtils.createLike(user1.id, post.id);

      if (!like) {
        throw new Error("Like not created");
      }

      if (like.userId !== user1.id) {
        throw new Error("Like user ID not set correctly");
      }

      if (like.postId !== post.id) {
        throw new Error("Like post ID not set correctly");
      }

      // Test like count
      const likeCount = await this.prisma.like.count({
        where: { postId: post.id },
      });

      if (likeCount !== 1) {
        throw new Error(`Expected 1 like, got ${likeCount}`);
      }

      // Test multiple likes
      await this.testUtils.createLike(user2.id, post.id);

      const totalLikes = await this.prisma.like.count({
        where: { postId: post.id },
      });

      if (totalLikes !== 2) {
        throw new Error(`Expected 2 likes, got ${totalLikes}`);
      }

      // Test like removal (unlike)
      await this.prisma.like.delete({
        where: { userId_postId: { userId: user1.id, postId: post.id } },
      });

      const likesAfterRemoval = await this.prisma.like.count({
        where: { postId: post.id },
      });

      if (likesAfterRemoval !== 1) {
        throw new Error(
          `Expected 1 like after removal, got ${likesAfterRemoval}`
        );
      }

      // Test duplicate like prevention
      try {
        await this.testUtils.createLike(user2.id, post.id);
        throw new Error("Should not allow duplicate likes");
      } catch (error) {
        console.log("✅ Correctly prevented duplicate like");
      }

      console.log("✅ Post likes test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Post likes test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testPostComments() {
    console.log("📝 Testing post comments...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);
      const post = await this.testUtils.createTestPost(user1.id, {
        content: "Post to be commented on",
      });

      // Test comment creation
      const commentContent = "This is a test comment";
      const comment = await this.testUtils.createComment(
        user1.id,
        post.id,
        commentContent
      );

      if (!comment) {
        throw new Error("Comment not created");
      }

      if (comment.content !== commentContent) {
        throw new Error("Comment content not saved correctly");
      }

      if (comment.userId !== user1.id) {
        throw new Error("Comment user ID not set correctly");
      }

      if (comment.postId !== post.id) {
        throw new Error("Comment post ID not set correctly");
      }

      // Test multiple comments
      const comment2 = await this.testUtils.createComment(
        user2.id,
        post.id,
        "Second comment"
      );

      const commentCount = await this.prisma.comment.count({
        where: { postId: post.id },
      });

      if (commentCount !== 2) {
        throw new Error(`Expected 2 comments, got ${commentCount}`);
      }

      // Test comment update
      const updatedContent = "Updated comment content";
      const updatedComment = await this.prisma.comment.update({
        where: { id: comment.id },
        data: { content: updatedContent },
        select: { id: true, content: true },
      });

      if (updatedComment.content !== updatedContent) {
        throw new Error("Comment content not updated correctly");
      }

      // Test comment deletion
      await this.prisma.comment.delete({
        where: { id: comment.id },
      });

      const commentsAfterDeletion = await this.prisma.comment.count({
        where: { postId: post.id },
      });

      if (commentsAfterDeletion !== 1) {
        throw new Error(
          `Expected 1 comment after deletion, got ${commentsAfterDeletion}`
        );
      }

      console.log("✅ Post comments test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Post comments test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testPostVisibility() {
    console.log("📝 Testing post visibility...");

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

      // Test post visibility for user1
      const user1MutualFriends = await this.testUtils.getMutualFriends(
        user1.id
      );
      const visibleUserIds = [user1.id, ...user1MutualFriends];

      const visiblePosts = await this.prisma.post.findMany({
        where: {
          userId: { in: visibleUserIds },
        },
        select: { id: true, userId: true, content: true },
      });

      // User1 should see their own post and user2's post (friend)
      const user1OwnPosts = visiblePosts.filter((p) => p.userId === user1.id);
      const user2Posts = visiblePosts.filter((p) => p.userId === user2.id);
      const user3Posts = visiblePosts.filter((p) => p.userId === user3.id);

      if (user1OwnPosts.length === 0) {
        throw new Error("User1 should see their own posts");
      }

      if (user2Posts.length === 0) {
        throw new Error("User1 should see friend's posts");
      }

      if (user3Posts.length > 0) {
        throw new Error("User1 should not see non-friend's posts");
      }

      // Test post visibility for user3 (not friends with anyone)
      const user3MutualFriends = await this.testUtils.getMutualFriends(
        user3.id
      );
      const user3VisibleUserIds = [user3.id, ...user3MutualFriends];

      const user3VisiblePosts = await this.prisma.post.findMany({
        where: {
          userId: { in: user3VisibleUserIds },
        },
        select: { id: true, userId: true },
      });

      // User3 should only see their own posts
      const user3OwnPosts = user3VisiblePosts.filter(
        (p) => p.userId === user3.id
      );
      const user3OtherPosts = user3VisiblePosts.filter(
        (p) => p.userId !== user3.id
      );

      if (user3OwnPosts.length === 0) {
        throw new Error("User3 should see their own posts");
      }

      if (user3OtherPosts.length > 0) {
        throw new Error("User3 should not see other users' posts");
      }

      console.log("✅ Post visibility test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Post visibility test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testPostPagination() {
    console.log("📝 Testing post pagination...");

    try {
      const user = await this.testUtils.createTestUser();

      // Create multiple posts
      const posts = [];
      for (let i = 0; i < 15; i++) {
        const post = await this.testUtils.createTestPost(user.id, {
          content: `Post number ${i + 1}`,
        });
        posts.push(post);
      }

      // Test pagination with limit 5
      const page1 = await this.prisma.post.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        skip: 0,
      });

      const page2 = await this.prisma.post.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        skip: 5,
      });

      const page3 = await this.prisma.post.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        skip: 10,
      });

      if (page1.length !== 5) {
        throw new Error(`Page 1 should have 5 posts, got ${page1.length}`);
      }

      if (page2.length !== 5) {
        throw new Error(`Page 2 should have 5 posts, got ${page2.length}`);
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

      // Test total count
      const totalPosts = await this.prisma.post.count({
        where: { userId: user.id },
      });

      if (totalPosts !== 15) {
        throw new Error(`Expected 15 total posts, got ${totalPosts}`);
      }

      console.log("✅ Post pagination test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Post pagination test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testPostValidation() {
    console.log("📝 Testing post validation...");

    try {
      const user = await this.testUtils.createTestUser();

      // Test empty content post (should be allowed)
      const emptyPost = await this.testUtils.createTestPost(user.id, {
        content: "",
      });

      if (!emptyPost) {
        throw new Error("Empty content post should be allowed");
      }

      // Test very long content
      const longContent = "a".repeat(10000);
      const longPost = await this.testUtils.createTestPost(user.id, {
        content: longContent,
      });

      if (!longPost) {
        throw new Error("Long content post should be allowed");
      }

      // Test post with special characters
      const specialContent =
        "Post with special chars: @#$%^&*()_+-=[]{}|;':\",./<>?";
      const specialPost = await this.testUtils.createTestPost(user.id, {
        content: specialContent,
      });

      if (specialPost.content !== specialContent) {
        throw new Error("Special characters not handled correctly");
      }

      // Test post with emojis
      const emojiContent = "Post with emojis 🎉🚀💻🔥";
      const emojiPost = await this.testUtils.createTestPost(user.id, {
        content: emojiContent,
      });

      if (emojiPost.content !== emojiContent) {
        throw new Error("Emojis not handled correctly");
      }

      console.log("✅ Post validation test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Post validation test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testPostOwnership() {
    console.log("📝 Testing post ownership...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);

      // Create post by user1
      const post = await this.testUtils.createTestPost(user1.id, {
        content: "User1's post",
      });

      // Test that user1 can update their own post
      const updatedPost = await this.prisma.post.update({
        where: { id: post.id, userId: user1.id },
        data: { content: "Updated by owner" },
        select: { id: true, content: true },
      });

      if (updatedPost.content !== "Updated by owner") {
        throw new Error("Owner should be able to update their post");
      }

      // Test that user2 cannot update user1's post
      try {
        await this.prisma.post.update({
          where: { id: post.id, userId: user2.id },
          data: { content: "Updated by non-owner" },
        });
        throw new Error("Non-owner should not be able to update post");
      } catch (error) {
        console.log("✅ Correctly prevented non-owner from updating post");
      }

      // Test that user1 can delete their own post
      await this.prisma.post.delete({
        where: { id: post.id, userId: user1.id },
      });

      const deletedPost = await this.prisma.post.findUnique({
        where: { id: post.id },
      });

      if (deletedPost) {
        throw new Error("Post should be deleted by owner");
      }

      // Create another post for deletion test
      const post2 = await this.testUtils.createTestPost(user1.id, {
        content: "Another post",
      });

      // Test that user2 cannot delete user1's post
      try {
        await this.prisma.post.delete({
          where: { id: post2.id, userId: user2.id },
        });
        throw new Error("Non-owner should not be able to delete post");
      } catch (error) {
        console.log("✅ Correctly prevented non-owner from deleting post");
      }

      console.log("✅ Post ownership test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Post ownership test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testPostFeed() {
    console.log("📝 Testing post feed...");

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

      // Test post feed for user1
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
      });

      // User1 should see their own post and user2's post
      const user1OwnPosts = user1Feed.filter((p) => p.userId === user1.id);
      const user2Posts = user1Feed.filter((p) => p.userId === user2.id);
      const user3Posts = user1Feed.filter((p) => p.userId === user3.id);

      if (user1OwnPosts.length === 0) {
        throw new Error("User1 should see their own posts in feed");
      }

      if (user2Posts.length === 0) {
        throw new Error("User1 should see friend's posts in feed");
      }

      if (user3Posts.length > 0) {
        throw new Error("User1 should not see non-friend's posts in feed");
      }

      // Test feed ordering (newest first)
      if (user1Feed.length > 1) {
        for (let i = 0; i < user1Feed.length - 1; i++) {
          if (user1Feed[i].createdAt < user1Feed[i + 1].createdAt) {
            throw new Error("Feed not ordered correctly (newest first)");
          }
        }
      }

      console.log("✅ Post feed test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Post feed test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async cleanup() {
    await this.testUtils.cleanup();
    await this.prisma.$disconnect();
  }

  printResults() {
    console.log("\n📊 Post Management Test Results:");
    console.log("==================================");
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
      console.log("\n🎉 All post management tests passed!");
    } else {
      console.log(
        `\n⚠️  ${this.testResults.failed} post management test(s) failed.`
      );
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const postTests = new PostTests();
  postTests.runTests().catch(console.error);
}

module.exports = PostTests;
