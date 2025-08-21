const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

class UserService {
  async createUser(userData) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = await prisma.user.create({
        data: {
          email: userData.email,
          username: userData.username,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isSeedUser: userData.isSeedUser || false,
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          bio: true,
          profilePicture: true,
          useGravatar: true,
          birthday: true,
          gender: true,
          location: true,
          createdAt: true,
          updatedAt: true,
          isSeedUser: true,
        },
      });

      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async findUserByEmail(email) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          password: true,
          firstName: true,
          lastName: true,
          bio: true,
          profilePicture: true,
          useGravatar: true,
          birthday: true,
          gender: true,
          location: true,
          createdAt: true,
          updatedAt: true,
          isSeedUser: true,
        },
      });

      return user;
    } catch (error) {
      console.error("Error finding user by email:", error);
      throw error;
    }
  }

  async findUserById(id) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          bio: true,
          profilePicture: true,
          useGravatar: true,
          birthday: true,
          gender: true,
          location: true,
          createdAt: true,
          updatedAt: true,
          isSeedUser: true,
        },
      });

      return user;
    } catch (error) {
      console.error("Error finding user by ID:", error);
      throw error;
    }
  }

  async findUserByUsername(username) {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          bio: true,
          profilePicture: true,
          useGravatar: true,
          birthday: true,
          gender: true,
          location: true,
          createdAt: true,
          updatedAt: true,
          isSeedUser: true,
        },
      });

      return user;
    } catch (error) {
      console.error("Error finding user by username:", error);
      throw error;
    }
  }

  async updateUserProfile(userId, updateData) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          bio: true,
          profilePicture: true,
          useGravatar: true,
          birthday: true,
          gender: true,
          location: true,
          createdAt: true,
          updatedAt: true,
          isSeedUser: true,
        },
      });

      return user;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  async updateProfilePicture(
    userId,
    profilePicture,
    cloudinaryPublicId = null
  ) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          profilePicture,
          cloudinaryPublicId,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          bio: true,
          profilePicture: true,
          useGravatar: true,
          cloudinaryPublicId: true,
          birthday: true,
          gender: true,
          location: true,
          createdAt: true,
          updatedAt: true,
          isSeedUser: true,
        },
      });

      return user;
    } catch (error) {
      console.error("Error updating profile picture:", error);
      throw error;
    }
  }

  async changePassword(userId, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return true;
    } catch (error) {
      console.error("Error changing password:", error);
      throw error;
    }
  }

  async verifyPassword(userId, password) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });

      if (!user) {
        return false;
      }

      return await bcrypt.compare(password, user.password);
    } catch (error) {
      console.error("Error verifying password:", error);
      throw error;
    }
  }

  async getUserStats(userId) {
    try {
      const [posts, friends, likes] = await Promise.all([
        prisma.post.count({ where: { userId } }),
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            friends: { select: { id: true } },
            friendOf: { select: { id: true } },
          },
        }),
        prisma.like.count({ where: { userId } }),
      ]);

      const outgoingFriends =
        friends?.friends?.map((friend) => friend.id) || [];
      const incomingFriends =
        friends?.friendOf?.map((friend) => friend.id) || [];
      const mutualFriendIds = outgoingFriends.filter((id) =>
        incomingFriends.includes(id)
      );

      return {
        postCount: posts,
        friendCount: mutualFriendIds.length,
        likeCount: likes,
      };
    } catch (error) {
      console.error("Error getting user stats:", error);
      throw error;
    }
  }

  async searchUsers(query, currentUserId, limit = 20) {
    try {
      const users = await prisma.user.findMany({
        where: {
          AND: [
            { id: { not: currentUserId } },
            {
              OR: [
                { username: { contains: query, mode: "insensitive" } },
                { firstName: { contains: query, mode: "insensitive" } },
                { lastName: { contains: query, mode: "insensitive" } },
              ],
            },
          ],
        },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
          useGravatar: true,
          bio: true,
          createdAt: true,
        },
        take: limit,
        orderBy: { username: "asc" },
      });

      return users;
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  }
}

module.exports = new UserService();
