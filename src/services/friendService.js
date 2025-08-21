const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class FriendService {
  async getMutualFriends(userId) {
    try {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          friends: { select: { id: true } },
          friendOf: { select: { id: true } },
        },
      });

      const outgoingFriends =
        currentUser?.friends?.map((friend) => friend.id) || [];
      const incomingFriends =
        currentUser?.friendOf?.map((friend) => friend.id) || [];
      const mutualFriendIds = outgoingFriends.filter((id) =>
        incomingFriends.includes(id)
      );

      return mutualFriendIds;
    } catch (error) {
      console.error("Error getting mutual friends:", error);
      throw error;
    }
  }

  async getAllUsersWithFriendStatus(userId) {
    try {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          friends: { select: { id: true } },
          friendOf: { select: { id: true } },
          sentRequests: {
            where: { status: "pending" },
            select: { id: true, receiverId: true },
          },
          receivedRequests: {
            where: { status: "pending" },
            select: { id: true, senderId: true },
          },
        },
      });

      const outgoingFriends =
        currentUser?.friends?.map((friend) => friend.id) || [];
      const incomingFriends =
        currentUser?.friendOf?.map((friend) => friend.id) || [];
      const mutualFriendIds = outgoingFriends.filter((id) =>
        incomingFriends.includes(id)
      );

      const outgoingRequestIds =
        currentUser?.sentRequests?.map((req) => req.receiverId) || [];
      const incomingRequestIds =
        currentUser?.receivedRequests?.map((req) => req.senderId) || [];

      const users = await prisma.user.findMany({
        where: { id: { not: userId } },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
          useGravatar: true,
          email: true,
          bio: true,
          createdAt: true,
        },
        orderBy: { username: "asc" },
      });

      return users.map((user) => {
        let status = "none";
        if (mutualFriendIds.includes(user.id)) {
          status = "friend";
        } else if (outgoingRequestIds.includes(user.id)) {
          status = "request_sent";
        } else if (incomingRequestIds.includes(user.id)) {
          status = "request_received";
        }

        return { ...user, friendStatus: status };
      });
    } catch (error) {
      console.error("Error getting users with friend status:", error);
      throw error;
    }
  }

  async sendFriendRequest(senderId, receiverId) {
    try {
      // Check if request already exists
      const existingRequest = await prisma.friendRequest.findFirst({
        where: {
          OR: [
            { senderId, receiverId },
            { senderId: receiverId, receiverId: senderId },
          ],
        },
      });

      if (existingRequest) {
        throw new Error("Friend request already exists");
      }

      const request = await prisma.friendRequest.create({
        data: { senderId, receiverId },
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

      return request;
    } catch (error) {
      console.error("Error sending friend request:", error);
      throw error;
    }
  }

  async acceptFriendRequest(requestId, userId) {
    try {
      const request = await prisma.friendRequest.findFirst({
        where: {
          id: requestId,
          receiverId: userId,
          status: "pending",
        },
      });

      if (!request) {
        throw new Error("Friend request not found or already processed");
      }

      await prisma.$transaction(async (tx) => {
        // Update request status
        await tx.friendRequest.update({
          where: { id: requestId },
          data: { status: "accepted" },
        });

        // Decline any reverse requests
        await tx.friendRequest.updateMany({
          where: {
            senderId: request.receiverId,
            receiverId: request.senderId,
            status: "pending",
            id: { not: requestId },
          },
          data: { status: "declined" },
        });

        // Create bidirectional friendship
        await tx.user.update({
          where: { id: request.receiverId },
          data: { friends: { connect: { id: request.senderId } } },
        });

        await tx.user.update({
          where: { id: request.senderId },
          data: { friends: { connect: { id: request.receiverId } } },
        });
      });

      return true;
    } catch (error) {
      console.error("Error accepting friend request:", error);
      throw error;
    }
  }

  async declineFriendRequest(requestId, userId) {
    try {
      const request = await prisma.friendRequest.findFirst({
        where: {
          id: requestId,
          receiverId: userId,
          status: "pending",
        },
      });

      if (!request) {
        throw new Error("Friend request not found or already processed");
      }

      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "declined" },
      });

      return true;
    } catch (error) {
      console.error("Error declining friend request:", error);
      throw error;
    }
  }

  async cancelFriendRequest(requestId, userId) {
    try {
      const request = await prisma.friendRequest.findFirst({
        where: {
          id: requestId,
          senderId: userId,
          status: "pending",
        },
      });

      if (!request) {
        throw new Error("Friend request not found or already processed");
      }

      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "cancelled" },
      });

      return true;
    } catch (error) {
      console.error("Error cancelling friend request:", error);
      throw error;
    }
  }

  async removeFriend(userId, friendId) {
    try {
      await prisma.$transaction(async (tx) => {
        // Remove from both users' friend lists
        await tx.user.update({
          where: { id: userId },
          data: { friends: { disconnect: { id: friendId } } },
        });

        await tx.user.update({
          where: { id: friendId },
          data: { friends: { disconnect: { id: userId } } },
        });
      });

      return true;
    } catch (error) {
      console.error("Error removing friend:", error);
      throw error;
    }
  }

  async getPendingRequests(userId) {
    try {
      const requests = await prisma.friendRequest.findMany({
        where: {
          receiverId: userId,
          status: "pending",
        },
        include: {
          sender: {
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
        orderBy: { createdAt: "desc" },
      });

      return requests;
    } catch (error) {
      console.error("Error getting pending requests:", error);
      throw error;
    }
  }

  async getSentRequests(userId) {
    try {
      const requests = await prisma.friendRequest.findMany({
        where: {
          senderId: userId,
          status: "pending",
        },
        include: {
          receiver: {
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
        orderBy: { createdAt: "desc" },
      });

      return requests;
    } catch (error) {
      console.error("Error getting sent requests:", error);
      throw error;
    }
  }
}

module.exports = new FriendService();
