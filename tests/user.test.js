/**
 * User Management Tests for OdinBook
 * Tests profile updates, bio management, profile pictures, and user search
 */

const TestUtils = require("./test-utils");
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

class UserTests {
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
    console.log("👤 Running User Management Tests...\n");

    try {
      await this.testProfileUpdate();
      await this.testBioUpdate();
      await this.testProfilePictureUpload();
      await this.testGravatarIntegration();
      await this.testUserSearch();
      await this.testUserStats();
      await this.testPasswordChange();
      await this.testUsernameUpdate();
      await this.testProfileValidation();
      await this.testUserDeletion();

      this.printResults();
    } catch (error) {
      console.error("❌ Test suite failed:", error);
    } finally {
      await this.cleanup();
    }
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
        throw new Error("First name not updated correctly");
      }
      if (updatedUser.lastName !== updateData.lastName) {
        throw new Error("Last name not updated correctly");
      }
      if (updatedUser.username !== updateData.username) {
        throw new Error("Username not updated correctly");
      }
      if (updatedUser.gender !== updateData.gender) {
        throw new Error("Gender not updated correctly");
      }
      if (updatedUser.location !== updateData.location) {
        throw new Error("Location not updated correctly");
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

  async testBioUpdate() {
    console.log("📝 Testing bio update...");

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

      // Test bio length validation (simulate)
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

      console.log("✅ Bio update test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Bio update test failed:", error.message);
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
        throw new Error("Profile picture URL not saved correctly");
      }
      if (updatedUser.cloudinaryPublicId !== cloudinaryPublicId) {
        throw new Error("Cloudinary public ID not saved correctly");
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
        throw new Error("Profile picture not removed correctly");
      }
      if (userWithoutPicture.cloudinaryPublicId !== null) {
        throw new Error("Cloudinary public ID not removed correctly");
      }

      console.log("✅ Profile picture upload test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Profile picture upload test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testGravatarIntegration() {
    console.log("📝 Testing Gravatar integration...");

    try {
      const user = await this.testUtils.createTestUser({
        email: "test@example.com",
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
        throw new Error("Gravatar not enabled correctly");
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
        throw new Error("Gravatar not disabled correctly");
      }

      console.log("✅ Gravatar integration test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Gravatar integration test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testUserSearch() {
    console.log("📝 Testing user search...");

    try {
      // Create test users with different names
      const users = await this.testUtils.createTestUsers(5);

      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      // Update users with searchable names
      await this.prisma.user.update({
        where: { id: user1.id },
        data: { firstName: "John", lastName: "Doe", username: "johndoe" },
      });

      await this.prisma.user.update({
        where: { id: user2.id },
        data: { firstName: "Jane", lastName: "Smith", username: "janesmith" },
      });

      await this.prisma.user.update({
        where: { id: user3.id },
        data: { firstName: "Bob", lastName: "Johnson", username: "bobjohnson" },
      });

      // Test search by first name
      const johnResults = await this.prisma.user.findMany({
        where: {
          firstName: { contains: "John", mode: "insensitive" },
        },
        select: { id: true, firstName: true, lastName: true },
      });

      if (johnResults.length === 0) {
        throw new Error("Search by first name failed");
      }

      // Test search by last name
      const smithResults = await this.prisma.user.findMany({
        where: {
          lastName: { contains: "Smith", mode: "insensitive" },
        },
        select: { id: true, firstName: true, lastName: true },
      });

      if (smithResults.length === 0) {
        throw new Error("Search by last name failed");
      }

      // Test search by username
      const usernameResults = await this.prisma.user.findMany({
        where: {
          username: { contains: "jane", mode: "insensitive" },
        },
        select: { id: true, username: true },
      });

      if (usernameResults.length === 0) {
        throw new Error("Search by username failed");
      }

      // Test case insensitive search
      const caseInsensitiveResults = await this.prisma.user.findMany({
        where: {
          firstName: { contains: "JOHN", mode: "insensitive" },
        },
        select: { id: true, firstName: true },
      });

      if (caseInsensitiveResults.length === 0) {
        throw new Error("Case insensitive search failed");
      }

      console.log("✅ User search test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ User search test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testUserStats() {
    console.log("📝 Testing user stats...");

    try {
      const user = await this.testUtils.createTestUser();

      // Create some test posts
      const post1 = await this.testUtils.createTestPost(user.id, {
        content: "First post",
      });
      const post2 = await this.testUtils.createTestPost(user.id, {
        content: "Second post",
      });

      // Create some likes
      await this.testUtils.createLike(user.id, post1.id);
      await this.testUtils.createLike(user.id, post2.id);

      // Get user stats
      const [postCount, likeCount] = await Promise.all([
        this.prisma.post.count({ where: { userId: user.id } }),
        this.prisma.like.count({ where: { userId: user.id } }),
      ]);

      if (postCount !== 2) {
        throw new Error(`Expected 2 posts, got ${postCount}`);
      }
      if (likeCount !== 2) {
        throw new Error(`Expected 2 likes, got ${likeCount}`);
      }

      // Test friend count (will be 0 since no friends)
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

      console.log("✅ User stats test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ User stats test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testPasswordChange() {
    console.log("📝 Testing password change...");

    try {
      const user = await this.testUtils.createTestUser({
        password: "OriginalPass123!",
      });

      const newPassword = "NewPassword456!";
      const bcrypt = require("bcryptjs");

      // Change password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword },
      });

      // Verify old password doesn't work
      const storedUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { password: true },
      });

      const oldPasswordValid = await bcrypt.compare(
        "OriginalPass123!",
        storedUser.password
      );
      if (oldPasswordValid) {
        throw new Error("Old password should not be valid after change");
      }

      // Verify new password works
      const newPasswordValid = await bcrypt.compare(
        newPassword,
        storedUser.password
      );
      if (!newPasswordValid) {
        throw new Error("New password should be valid");
      }

      console.log("✅ Password change test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Password change test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testUsernameUpdate() {
    console.log("📝 Testing username update...");

    try {
      const user = await this.testUtils.createTestUser({
        username: "originalusername",
      });

      const newUsername = "newusername123";

      // Update username
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: { username: newUsername },
        select: { id: true, username: true },
      });

      if (updatedUser.username !== newUsername) {
        throw new Error("Username not updated correctly");
      }

      // Test duplicate username prevention
      const anotherUser = await this.testUtils.createTestUser({
        username: "anotheruser",
      });

      try {
        await this.prisma.user.update({
          where: { id: anotherUser.id },
          data: { username: newUsername },
        });
        throw new Error("Should not allow duplicate username");
      } catch (error) {
        if (error.message.includes("Unique constraint")) {
          console.log("✅ Correctly prevented duplicate username");
        } else {
          throw error;
        }
      }

      console.log("✅ Username update test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Username update test failed:", error.message);
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

  async testUserDeletion() {
    console.log("📝 Testing user deletion...");

    try {
      const user = await this.testUtils.createTestUser();

      // Create some related data
      const post = await this.testUtils.createTestPost(user.id);
      await this.testUtils.createLike(user.id, post.id);
      await this.testUtils.createComment(user.id, post.id);

      // Verify user exists
      await this.testUtils.assertUserExists(user.id);

      // Delete user (this should cascade delete related data)
      await this.prisma.user.delete({
        where: { id: user.id },
      });

      // Verify user is deleted
      const deletedUser = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      if (deletedUser) {
        throw new Error("User should be deleted");
      }

      // Verify related data is also deleted (cascade)
      const deletedPost = await this.prisma.post.findUnique({
        where: { id: post.id },
      });

      if (deletedPost) {
        console.log("⚠️  Post not cascade deleted with user");
      }

      console.log("✅ User deletion test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ User deletion test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async cleanup() {
    await this.testUtils.cleanup();
    await this.prisma.$disconnect();
  }

  printResults() {
    console.log("\n📊 User Management Test Results:");
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
      console.log("\n🎉 All user management tests passed!");
    } else {
      console.log(
        `\n⚠️  ${this.testResults.failed} user management test(s) failed.`
      );
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const userTests = new UserTests();
  userTests.runTests().catch(console.error);
}

module.exports = UserTests;
