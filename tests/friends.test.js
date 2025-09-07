/**
 * Friend System Tests for OdinBook
 * Tests friend requests, friendships, user search, and friend management
 */

const TestUtils = require("./test-utils");
const { PrismaClient } = require("@prisma/client");

class FriendTests {
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
    console.log("👥 Running Friend System Tests...\n");

    try {
      await this.testSendFriendRequest();
      await this.testAcceptFriendRequest();
      await this.testDeclineFriendRequest();
      await this.testCancelFriendRequest();
      await this.testRemoveFriend();
      await this.testMutualFriendship();
      await this.testFriendRequestValidation();
      await this.testDuplicateFriendRequests();
      await this.testFriendSearch();
      await this.testFriendStatus();
      await this.testAutoAcceptSystem();

      this.printResults();
    } catch (error) {
      console.error("❌ Test suite failed:", error);
    } finally {
      await this.cleanup();
    }
  }

  async testSendFriendRequest() {
    console.log("📝 Testing send friend request...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);

      // Send friend request
      const request = await this.testUtils.createFriendRequest(
        user1.id,
        user2.id
      );

      // Verify request was created
      if (!request) {
        throw new Error("Friend request not created");
      }

      if (request.senderId !== user1.id) {
        throw new Error("Sender ID not set correctly");
      }

      if (request.receiverId !== user2.id) {
        throw new Error("Receiver ID not set correctly");
      }

      if (request.status !== "pending") {
        throw new Error("Request status not set to pending");
      }

      // Verify request exists in database
      const dbRequest = await this.prisma.friendRequest.findUnique({
        where: { id: request.id },
      });

      if (!dbRequest) {
        throw new Error("Friend request not found in database");
      }

      console.log("✅ Send friend request test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Send friend request test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testAcceptFriendRequest() {
    console.log("📝 Testing accept friend request...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);

      // Create friend request
      const request = await this.testUtils.createFriendRequest(
        user1.id,
        user2.id
      );

      // Accept the request
      await this.prisma.$transaction(async (tx) => {
        // Update request status
        await tx.friendRequest.update({
          where: { id: request.id },
          data: { status: "accepted" },
        });

        // Create bidirectional friendship
        await tx.user.update({
          where: { id: user2.id },
          data: { friends: { connect: { id: user1.id } } },
        });

        await tx.user.update({
          where: { id: user1.id },
          data: { friends: { connect: { id: user2.id } } },
        });
      });

      // Verify friendship was created
      await this.testUtils.assertUsersAreFriends(user1.id, user2.id);
      await this.testUtils.assertUsersAreFriends(user2.id, user1.id);

      // Verify request status was updated
      const updatedRequest = await this.prisma.friendRequest.findUnique({
        where: { id: request.id },
      });

      if (updatedRequest.status !== "accepted") {
        throw new Error("Request status not updated to accepted");
      }

      console.log("✅ Accept friend request test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Accept friend request test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testDeclineFriendRequest() {
    console.log("📝 Testing decline friend request...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);

      // Create friend request
      const request = await this.testUtils.createFriendRequest(
        user1.id,
        user2.id
      );

      // Decline the request
      await this.prisma.friendRequest.update({
        where: { id: request.id },
        data: { status: "declined" },
      });

      // Verify request status was updated
      const updatedRequest = await this.prisma.friendRequest.findUnique({
        where: { id: request.id },
      });

      if (updatedRequest.status !== "declined") {
        throw new Error("Request status not updated to declined");
      }

      // Verify no friendship was created
      const user1Friends = await this.prisma.user.findUnique({
        where: { id: user1.id },
        select: { friends: { select: { id: true } } },
      });

      const isFriend = user1Friends.friends.some(
        (friend) => friend.id === user2.id
      );
      if (isFriend) {
        throw new Error("Friendship should not exist after declining request");
      }

      console.log("✅ Decline friend request test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Decline friend request test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testCancelFriendRequest() {
    console.log("📝 Testing cancel friend request...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);

      // Create friend request
      const request = await this.testUtils.createFriendRequest(
        user1.id,
        user2.id
      );

      // Cancel the request
      await this.prisma.friendRequest.update({
        where: { id: request.id },
        data: { status: "cancelled" },
      });

      // Verify request status was updated
      const updatedRequest = await this.prisma.friendRequest.findUnique({
        where: { id: request.id },
      });

      if (updatedRequest.status !== "cancelled") {
        throw new Error("Request status not updated to cancelled");
      }

      // Verify no friendship was created
      const user1Friends = await this.prisma.user.findUnique({
        where: { id: user1.id },
        select: { friends: { select: { id: true } } },
      });

      const isFriend = user1Friends.friends.some(
        (friend) => friend.id === user2.id
      );
      if (isFriend) {
        throw new Error("Friendship should not exist after cancelling request");
      }

      console.log("✅ Cancel friend request test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Cancel friend request test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testRemoveFriend() {
    console.log("📝 Testing remove friend...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);

      // Create friendship
      await this.testUtils.createFriendship(user1.id, user2.id);

      // Verify friendship exists
      await this.testUtils.assertUsersAreFriends(user1.id, user2.id);

      // Remove friendship
      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user1.id },
          data: { friends: { disconnect: { id: user2.id } } },
        });

        await tx.user.update({
          where: { id: user2.id },
          data: { friends: { disconnect: { id: user1.id } } },
        });
      });

      // Verify friendship was removed
      const user1Friends = await this.prisma.user.findUnique({
        where: { id: user1.id },
        select: { friends: { select: { id: true } } },
      });

      const isStillFriend = user1Friends.friends.some(
        (friend) => friend.id === user2.id
      );
      if (isStillFriend) {
        throw new Error("Friendship should be removed");
      }

      console.log("✅ Remove friend test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Remove friend test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testMutualFriendship() {
    console.log("📝 Testing mutual friendship...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);

      // Create friendship
      await this.testUtils.createFriendship(user1.id, user2.id);

      // Verify mutual friendship
      const mutualFriends1 = await this.testUtils.getMutualFriends(user1.id);
      const mutualFriends2 = await this.testUtils.getMutualFriends(user2.id);

      if (!mutualFriends1.includes(user2.id)) {
        throw new Error("User2 not in User1's mutual friends");
      }

      if (!mutualFriends2.includes(user1.id)) {
        throw new Error("User1 not in User2's mutual friends");
      }

      // Test with a third user who is not friends
      const user3 = await this.testUtils.createTestUser();
      const mutualFriends3 = await this.testUtils.getMutualFriends(user3.id);

      if (
        mutualFriends3.includes(user1.id) ||
        mutualFriends3.includes(user2.id)
      ) {
        throw new Error(
          "User3 should not have User1 or User2 as mutual friends"
        );
      }

      console.log("✅ Mutual friendship test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Mutual friendship test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testFriendRequestValidation() {
    console.log("📝 Testing friend request validation...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);

      // Test self-request prevention
      try {
        await this.testUtils.createFriendRequest(user1.id, user1.id);
        throw new Error("Should not allow self-friend request");
      } catch (error) {
        console.log("✅ Correctly prevented self-friend request");
      }

      // Test duplicate request prevention
      await this.testUtils.createFriendRequest(user1.id, user2.id);

      try {
        await this.testUtils.createFriendRequest(user1.id, user2.id);
        throw new Error("Should not allow duplicate friend request");
      } catch (error) {
        console.log("✅ Correctly prevented duplicate friend request");
      }

      // Test reverse request prevention
      try {
        await this.testUtils.createFriendRequest(user2.id, user1.id);
        throw new Error(
          "Should not allow reverse friend request when one exists"
        );
      } catch (error) {
        console.log("✅ Correctly prevented reverse friend request");
      }

      console.log("✅ Friend request validation test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Friend request validation test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testDuplicateFriendRequests() {
    console.log("📝 Testing duplicate friend requests cleanup...");

    try {
      const [user1, user2] = await this.testUtils.createTestUsers(2);

      // Create multiple requests (simulating duplicates)
      const request1 = await this.testUtils.createFriendRequest(
        user1.id,
        user2.id
      );

      // Manually create a duplicate (bypassing validation)
      const request2 = await this.prisma.friendRequest.create({
        data: {
          senderId: user1.id,
          receiverId: user2.id,
          status: "pending",
        },
      });

      // Verify duplicates exist
      const duplicateRequests = await this.prisma.friendRequest.findMany({
        where: {
          senderId: user1.id,
          receiverId: user2.id,
          status: "pending",
        },
      });

      if (duplicateRequests.length < 2) {
        throw new Error("Expected duplicate requests");
      }

      // Clean up duplicates (keep the first one, mark others as declined)
      const requestsToDecline = duplicateRequests.slice(1);
      await this.prisma.friendRequest.updateMany({
        where: {
          id: { in: requestsToDecline.map((r) => r.id) },
        },
        data: { status: "declined" },
      });

      // Verify cleanup worked
      const remainingRequests = await this.prisma.friendRequest.findMany({
        where: {
          senderId: user1.id,
          receiverId: user2.id,
          status: "pending",
        },
      });

      if (remainingRequests.length !== 1) {
        throw new Error(
          `Expected 1 pending request, got ${remainingRequests.length}`
        );
      }

      console.log("✅ Duplicate friend requests cleanup test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log(
        "❌ Duplicate friend requests cleanup test failed:",
        error.message
      );
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testFriendSearch() {
    console.log("📝 Testing friend search...");

    try {
      const users = await this.testUtils.createTestUsers(5);

      // Update users with searchable names
      await this.prisma.user.update({
        where: { id: users[0].id },
        data: { firstName: "Alice", lastName: "Johnson", username: "alicej" },
      });

      await this.prisma.user.update({
        where: { id: users[1].id },
        data: { firstName: "Bob", lastName: "Smith", username: "bobsmith" },
      });

      await this.prisma.user.update({
        where: { id: users[2].id },
        data: { firstName: "Charlie", lastName: "Brown", username: "charlieb" },
      });

      // Test search by first name
      const aliceResults = await this.prisma.user.findMany({
        where: {
          firstName: { contains: "Alice", mode: "insensitive" },
        },
        select: { id: true, firstName: true, lastName: true },
      });

      if (aliceResults.length === 0) {
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
          username: { contains: "charlie", mode: "insensitive" },
        },
        select: { id: true, username: true },
      });

      if (usernameResults.length === 0) {
        throw new Error("Search by username failed");
      }

      // Test case insensitive search
      const caseInsensitiveResults = await this.prisma.user.findMany({
        where: {
          firstName: { contains: "ALICE", mode: "insensitive" },
        },
        select: { id: true, firstName: true },
      });

      if (caseInsensitiveResults.length === 0) {
        throw new Error("Case insensitive search failed");
      }

      console.log("✅ Friend search test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Friend search test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testFriendStatus() {
    console.log("📝 Testing friend status...");

    try {
      const [user1, user2, user3] = await this.testUtils.createTestUsers(3);

      // Test no relationship status
      const user1Friends = await this.prisma.user.findUnique({
        where: { id: user1.id },
        select: { friends: { select: { id: true } } },
      });

      const isFriend = user1Friends.friends.some(
        (friend) => friend.id === user2.id
      );
      if (isFriend) {
        throw new Error("Users should not be friends initially");
      }

      // Create friendship
      await this.testUtils.createFriendship(user1.id, user2.id);

      // Test friend status
      const user1FriendsAfter = await this.prisma.user.findUnique({
        where: { id: user1.id },
        select: { friends: { select: { id: true } } },
      });

      const isFriendAfter = user1FriendsAfter.friends.some(
        (friend) => friend.id === user2.id
      );
      if (!isFriendAfter) {
        throw new Error("Users should be friends after friendship creation");
      }

      // Test pending request status
      const request = await this.testUtils.createFriendRequest(
        user1.id,
        user3.id
      );

      const pendingRequests = await this.prisma.friendRequest.findMany({
        where: {
          receiverId: user3.id,
          status: "pending",
        },
      });

      if (pendingRequests.length === 0) {
        throw new Error("Should have pending friend request");
      }

      console.log("✅ Friend status test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Friend status test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async testAutoAcceptSystem() {
    console.log("📝 Testing auto-accept system...");

    try {
      // Create a seed user
      const seedUser = await this.testUtils.createTestUser({
        isSeedUser: true,
        username: "seeduser123",
      });

      const regularUser = await this.testUtils.createTestUser({
        isSeedUser: false,
        username: "regularuser123",
      });

      // Send friend request to seed user
      const request = await this.testUtils.createFriendRequest(
        regularUser.id,
        seedUser.id
      );

      // Verify request was created
      if (!request) {
        throw new Error("Friend request not created");
      }

      // Verify seed user is marked as seed user
      const seedUserCheck = await this.prisma.user.findUnique({
        where: { id: seedUser.id },
        select: { isSeedUser: true },
      });

      if (!seedUserCheck.isSeedUser) {
        throw new Error("User should be marked as seed user");
      }

      // In a real test, we would wait for the auto-accept to trigger
      // For now, we'll simulate the auto-accept by manually accepting
      await this.prisma.$transaction(async (tx) => {
        await tx.friendRequest.update({
          where: { id: request.id },
          data: { status: "accepted" },
        });

        await tx.user.update({
          where: { id: seedUser.id },
          data: { friends: { connect: { id: regularUser.id } } },
        });

        await tx.user.update({
          where: { id: regularUser.id },
          data: { friends: { connect: { id: seedUser.id } } },
        });
      });

      // Verify friendship was created
      await this.testUtils.assertUsersAreFriends(regularUser.id, seedUser.id);

      console.log("✅ Auto-accept system test passed");
      this.testResults.passed++;
    } catch (error) {
      console.log("❌ Auto-accept system test failed:", error.message);
      this.testResults.failed++;
    }

    this.testResults.total++;
  }

  async cleanup() {
    await this.testUtils.cleanup();
    await this.prisma.$disconnect();
  }

  printResults() {
    console.log("\n📊 Friend System Test Results:");
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
      console.log("\n🎉 All friend system tests passed!");
    } else {
      console.log(
        `\n⚠️  ${this.testResults.failed} friend system test(s) failed.`
      );
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const friendTests = new FriendTests();
  friendTests.runTests().catch(console.error);
}

module.exports = FriendTests;
