const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    });

    if (existingUser) {
      console.log("Test user already exists:", existingUser.email);
      return existingUser;
    }

    // Create test user
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await prisma.user.create({
      data: {
        email: "test@example.com",
        username: "testuser",
        password: hashedPassword,
        firstName: "Test",
        lastName: "User",
      },
    });

    console.log("Created test user:", user.email);
    return user;
  } catch (error) {
    console.error("Error creating test user:", error);
  }
}

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
      },
    });
    console.log("Users in database:", users);
    return users;
  } catch (error) {
    console.error("Error listing users:", error);
  }
}

async function main() {
  await createTestUser();
  await listUsers();
  await prisma.$disconnect();
}

main();
