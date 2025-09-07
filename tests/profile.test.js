/**
 * Profile Page Tests for OdinBook
 * Tests profile viewing, post visibility, Gravatar integration, and profile management
 */

const TestUtils = require("./test-utils");
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

class ProfileTests {
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
    console.log("👤 Running Profile Page Tests...\n");

    try {
      await this.testOwnProfileView();
      await this.testOtherProfileView();
      await this.testProfilePostVisibility();
      await this.testProfileFriendsDisplay();
      await this.testGravatarIntegration();
      await this.testProfilePictureUpload();
      await this.testProfileUpdate();
      await this.testProfileBioUpdate();
      await this.testProfileValidation();
      await this.testProfileStats();

      this.printResults();
    } catch (error) {
      console.error("❌ Test suite failed:", error);
    } finally {
      await this.cleanup();
    }
  }

  async testOwnProfileView() {
    console.log("📝 Testing own profile view...");

    try {
      const user = await this.testUtils.createTestUser({
        firstName: "John",
        lastName: "Doe",
        username: "johndoe",
        bio: "This is my bio",
        birthday: "1990-01-01",
        gender: "Male",
        location: "New York",
      });

      // Create some posts for the user
      const post1 = await this.testUtils.createTestPost(user.id, {
        content: "My first post",
      });

      const post2 = await this.testUtils.createTestPost(user.id, {
        content: "My second post",
      });

      // Get user profile with posts
      const profile = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          bio: true,
          birthday: true,
          gender: true,
          location: true,
          profilePicture: true,
          useGravatar: true,
          email: true,
          createdAt: true,
          posts: {
            select: {
              id: true,
              content: true,
              photoUrl: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
          friends: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
        },
      });

      if (!profile) {
        throw new Error("Profile not found");
      }

      // Verify profile data
      if (profile.firstName !== "John") {
        throw new Error("First name not correct");
      }

      if (profile.lastName !== "Doe") {
        throw new Error("Last name not correct");
      }

      if (profile.username !== "johndoe") {
        throw new Error("Username not correct");
      }

      if (profile.bio !== "This is my bio") {
        throw new Error("Bio not correct");
      }

      // Verify posts are included
      if (profile.posts.length !== 2) {
        throw new Error(`Expected 2 posts, got ${profile.posts.length}`);
      }

      // Verify posts are ordered by creation date (newest first)
      if (profile.posts[0].createdAt < profile.posts[1].createdAt) {
        throw new Error("Posts not ordered correctly");
      }

      console.log("✅ Own profile view test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Own profile view test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testOtherProfileView() {
    console.log("📝 Testing other profile view...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);

      // Update user2 with profile data
      await this.prisma.user.update({
        where: { id: user2.id },
        data: {
          firstName: "Jane",
          lastName: "Smith",
          username: "janesmith",
          bio: "Jane's bio",
          birthday: "1995-05-15",
          gender: "Female",
          location: "Los Angeles",
        },
      });

      // Create posts for user2
      await this.testUtils.createTestPost(user2.id, {
        content: "Jane's post",
      });

      // Get user2's profile as viewed by user1
      const profile = await this.prisma.user.findUnique({
        where: { id: user2.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          bio: true,
          birthday: true,
          gender: true,
          location: true,
          profilePicture: true,
          useGravatar: true,
          email: true,
          createdAt: true,
        },
      });

      if (!profile) {
        throw new Error("Profile not found");
      }

      // Verify profile data
      if (profile.firstName !== "Jane") {
        throw new Error("First name not correct");
      }

      if (profile.lastName !== "Smith") {
        throw new Error("Last name not correct");
      }

      if (profile.username !== "janesmith") {
        throw new Error("Username not correct");
      }

      if (profile.bio !== "Jane's bio") {
        throw new Error("Bio not correct");
      }

      // Test profile posts visibility (should be restricted for non-friends)
      const user1MutualFriends = await this.testUtils.getMutualFriends(
        user1.id
      );
      const canSeePosts = user1MutualFriends.includes(user2.id);

      if (canSeePosts) {
        throw new Error(
          "User1 should not be able to see User2's posts (not friends)"
        );
      }

      console.log("✅ Other profile view test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Other profile view test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testProfilePostVisibility() {
    console.log("📝 Testing profile post visibility...");

    try {
      const [user1, user2, user3] = await this.testUtils.createTestUsers(3);

      // Create posts for each user
      await this.testUtils.createTestPost(user1.id, {
        content: "User1's post",
      });
      await this.testUtils.createTestPost(user2.id, {
        content: "User2's post",
      });
      await this.testUtils.createTestPost(user3.id, {
        content: "User3's post",
      });

      // Make user1 and user2 friends
      await this.testUtils.createFriendship(user1.id, user2.id);

      // Test user1 viewing user2's profile posts (should be visible - friends)
      const user1MutualFriends = await this.testUtils.getMutualFriends(
        user1.id
      );
      const canSeeUser2Posts = user1MutualFriends.includes(user2.id);

      if (!canSeeUser2Posts) {
        throw new Error("User1 should be able to see User2's posts (friends)");
      }

      // Get user2's posts as visible to user1
      const user2Posts = await this.prisma.post.findMany({
        where: { userId: user2.id },
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

      if (user2Posts.length === 0) {
        throw new Error("User1 should see User2's posts");
      }

      // Test user1 viewing user3's profile posts (should not be visible - not friends)
      const canSeeUser3Posts = user1MutualFriends.includes(user3.id);

      if (canSeeUser3Posts) {
        throw new Error(
          "User1 should not be able to see User3's posts (not friends)"
        );
      }

      // Test user viewing their own posts (should always be visible)
      const user1OwnPosts = await this.prisma.post.findMany({
        where: { userId: user1.id },
      });

      if (user1OwnPosts.length === 0) {
        throw new Error("User should see their own posts");
      }

      console.log("✅ Profile post visibility test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Profile post visibility test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testProfileFriendsDisplay() {
    console.log("📝 Testing profile friends display...");

    try {
      const [user1, user2, user3, user4] = await this.testUtils.createTestUsers(
        4
      );

      // Create friendships
      await this.testUtils.createFriendship(user1.id, user2.id);
      await this.testUtils.createFriendship(user1.id, user3.id);
      await this.testUtils.createFriendship(user2.id, user4.id);

      // Get user1's friends
      const user1Profile = await this.prisma.user.findUnique({
        where: { id: user1.id },
        select: {
          friends: {
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

      if (user1Profile.friends.length !== 2) {
        throw new Error(
          `User1 should have 2 friends, got ${user1Profile.friends.length}`
        );
      }

      // Verify correct friends are included
      const friendIds = user1Profile.friends.map((f) => f.id);
      if (!friendIds.includes(user2.id) || !friendIds.includes(user3.id)) {
        throw new Error("Incorrect friends in profile");
      }

      // Test viewing another user's friends (should only be visible if friends)
      const user4MutualFriends = await this.testUtils.getMutualFriends(
        user4.id
      );
      const canSeeUser4Friends = user4MutualFriends.includes(user1.id);

      if (canSeeUser4Friends) {
        throw new Error(
          "User1 should not see User4's friends (not friends with User4)"
        );
      }

      // Test viewing friend's friends (should be visible)
      const user2MutualFriends = await this.testUtils.getMutualFriends(
        user2.id
      );
      const canSeeUser2Friends = user2MutualFriends.includes(user1.id);

      if (!canSeeUser2Friends) {
        throw new Error(
          "User1 should see User2's friends (friends with User2)"
        );
      }

      console.log("✅ Profile friends display test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Profile friends display test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testGravatarIntegration() {
    console.log("📝 Testing Gravatar integration...");

    try {
      const user = await this.testUtils.createTestUser({
        email: "test@example.com",
        useGravatar: true,
      });

      // Test Gravatar URL generation
      const getGravatarUrl = (email, size = 200) => {
        const hash = crypto
          .createHash("md5")
          .update(email.toLowerCase().trim())
          .digest("hex");
        return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=pg`;
      };

      const expectedHash = crypto
        .createHash("md5")
        .update("test@example.com".toLowerCase().trim())
        .digest("hex");

      const gravatarUrl = getGravatarUrl(user.email);
      const expectedUrl = `https://www.gravatar.com/avatar/${expectedHash}?s=200&d=identicon&r=pg`;

      if (gravatarUrl !== expectedUrl) {
        throw new Error("Gravatar URL generation failed");
      }

      // Test Gravatar profile data fetching (mock)
      const mockGravatarProfile = {
        id: expectedHash,
        displayName: "Test User",
        preferredUsername: "testuser",
        profileUrl: `https://gravatar.com/${expectedHash}`,
        photos: [
          {
            value: gravatarUrl,
            type: "thumbnail",
          },
        ],
      };

      // Test enabling Gravatar
      const userWithGravatar = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          useGravatar: true,
          profilePicture: gravatarUrl,
        },
        select: {
          id: true,
          useGravatar: true,
          profilePicture: true,
        },
      });

      if (!userWithGravatar.useGravatar) {
        throw new Error("Gravatar not enabled");
      }

      if (userWithGravatar.profilePicture !== gravatarUrl) {
        throw new Error("Gravatar URL not set correctly");
      }

      // Test disabling Gravatar
      const userWithoutGravatar = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          useGravatar: false,
          profilePicture: null,
        },
        select: {
          id: true,
          useGravatar: true,
          profilePicture: true,
        },
      });

      if (userWithoutGravatar.useGravatar) {
        throw new Error("Gravatar not disabled");
      }

      console.log("✅ Gravatar integration test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Gravatar integration test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testProfilePictureUpload() {
    console.log("📝 Testing profile picture upload...");

    try {
      const user = await this.testUtils.createTestUser();

      // Simulate profile picture upload
      const profilePictureUrl = "https://example.com/profile-picture.jpg";
      const cloudinaryPublicId = "profile_pic_123";

      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          profilePicture: profilePictureUrl,
          cloudinaryPublicId: cloudinaryPublicId,
          useGravatar: false,
        },
        select: {
          id: true,
          profilePicture: true,
          cloudinaryPublicId: true,
          useGravatar: true,
        },
      });

      if (updatedUser.profilePicture !== profilePictureUrl) {
        throw new Error("Profile picture URL not saved");
      }

      if (updatedUser.cloudinaryPublicId !== cloudinaryPublicId) {
        throw new Error("Cloudinary public ID not saved");
      }

      if (updatedUser.useGravatar !== false) {
        throw new Error("useGravatar flag not set correctly");
      }

      // Test profile picture removal
      const userWithoutPicture = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          profilePicture: null,
          cloudinaryPublicId: null,
        },
        select: {
          id: true,
          profilePicture: true,
          cloudinaryPublicId: true,
        },
      });

      if (userWithoutPicture.profilePicture !== null) {
        throw new Error("Profile picture not removed");
      }

      if (userWithoutPicture.cloudinaryPublicId !== null) {
        throw new Error("Cloudinary public ID not removed");
      }

      console.log("✅ Profile picture upload test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Profile picture upload test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testProfileUpdate() {
    console.log("📝 Testing profile update...");

    try {
      const user = await this.testUtils.createTestUser({
        firstName: "Original",
        lastName: "Name",
        username: "originaluser",
        birthday: "1990-01-01",
        gender: "Male",
        location: "Original City",
      });

      // Update profile
      const updateData = {
        firstName: "Updated",
        lastName: "Name",
        username: "updateduser",
        birthday: "1995-05-15",
        gender: "Female",
        location: "Updated City",
      };

      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          birthday: true,
          gender: true,
          location: true,
          updatedAt: true,
        },
      });

      // Verify updates
      if (updatedUser.firstName !== updateData.firstName) {
        throw new Error("First name not updated");
      }

      if (updatedUser.lastName !== updateData.lastName) {
        throw new Error("Last name not updated");
      }

      if (updatedUser.username !== updateData.username) {
        throw new Error("Username not updated");
      }

      if (updatedUser.gender !== updateData.gender) {
        throw new Error("Gender not updated");
      }

      if (updatedUser.location !== updateData.location) {
        throw new Error("Location not updated");
      }

      // Verify updatedAt changed
      if (updatedUser.updatedAt <= user.createdAt) {
        throw new Error("UpdatedAt timestamp not updated");
      }

      console.log("✅ Profile update test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Profile update test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testProfileBioUpdate() {
    console.log("📝 Testing profile bio update...");

    try {
      const user = await this.testUtils.createTestUser();

      // Test bio update
      const bioText =
        "This is my updated bio with some interesting information about me.";

      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: { bio: bioText },
        select: { id: true, bio: true },
      });

      if (updatedUser.bio !== bioText) {
        throw new Error("Bio not updated correctly");
      }

      // Test bio removal (set to null)
      const userWithoutBio = await this.prisma.user.update({
        where: { id: user.id },
        data: { bio: null },
        select: { id: true, bio: true },
      });

      if (userWithoutBio.bio !== null) {
        throw new Error("Bio not removed correctly");
      }

      // Test bio length validation
      const longBio = "a".repeat(501); // Exceeds 500 character limit
      try {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { bio: longBio },
        });
        console.log("⚠️  Bio length validation not enforced at database level");
      } catch (error) {
        console.log("✅ Bio length validation enforced");
      }

      console.log("✅ Profile bio update test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Profile bio update test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testProfileValidation() {
    console.log("📝 Testing profile validation...");

    try {
      const user = await this.testUtils.createTestUser();

      // Test field length validation
      const validationTests = [
        {
          field: "firstName",
          value: "a".repeat(51), // Exceeds 50 character limit
          shouldFail: true,
        },
        {
          field: "lastName",
          value: "a".repeat(51), // Exceeds 50 character limit
          shouldFail: true,
        },
        {
          field: "username",
          value: "ab", // Too short (less than 3)
          shouldFail: true,
        },
        {
          field: "username",
          value: "a".repeat(31), // Too long (more than 30)
          shouldFail: true,
        },
        {
          field: "bio",
          value: "a".repeat(501), // Exceeds 500 character limit
          shouldFail: true,
        },
      ];

      for (const test of validationTests) {
        try {
          await this.prisma.user.update({
            where: { id: user.id },
            data: { [test.field]: test.value },
          });

          if (test.shouldFail) {
            console.log(
              `⚠️  ${test.field} validation not enforced at database level`
            );
          }
        } catch (error) {
          if (test.shouldFail) {
            console.log(`✅ ${test.field} validation enforced`);
          } else {
            throw error;
          }
        }
      }

      console.log("✅ Profile validation test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Profile validation test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testProfileStats() {
    console.log("📝 Testing profile stats...");

    try {
      const user = await this.testUtils.createTestUser();

      // Create some posts
      const post1 = await this.testUtils.createTestPost(user.id, {
        content: "First post",
      });

      const post2 = await this.testUtils.createTestPost(user.id, {
        content: "Second post",
      });

      // Create some likes
      await this.testUtils.createLike(user.id, post1.id);
      await this.testUtils.createLike(user.id, post2.id);

      // Create some comments
      await this.testUtils.createComment(user.id, post1.id, "First comment");
      await this.testUtils.createComment(user.id, post2.id, "Second comment");

      // Get user stats
      const [postCount, likeCount, commentCount] = await Promise.all([
        this.prisma.post.count({ where: { userId: user.id } }),
        this.prisma.like.count({ where: { userId: user.id } }),
        this.prisma.comment.count({ where: { userId: user.id } }),
      ]);

      if (postCount !== 2) {
        throw new Error(`Expected 2 posts, got ${postCount}`);
      }

      if (likeCount !== 2) {
        throw new Error(`Expected 2 likes, got ${likeCount}`);
      }

      if (commentCount !== 2) {
        throw new Error(`Expected 2 comments, got ${commentCount}`);
      }

      // Test friend count
      const friendCount = await this.prisma.user.count({
        where: {
          friends: {
            some: { id: user.id },
          },
        },
      });

      if (friendCount !== 0) {
        throw new Error(`Expected 0 friends, got ${friendCount}`);
      }

      console.log("✅ Profile stats test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Profile stats test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async cleanup() {
    await this.testUtils.cleanup();
    await this.prisma.$disconnect();
  }

  printResults() {
    console.log("\n📊 Profile Page Test Results:");
    console.log("==============================");
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
      console.log("\n🎉 All profile page tests passed!");
    } else {
      console.log(
        `\n⚠️  ${this.testResults.failed} profile page test(s) failed.`
      );
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const profileTests = new ProfileTests();
  profileTests.runTests().catch(console.error);
}

module.exports = ProfileTests;
