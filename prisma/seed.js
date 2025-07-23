// prisma/seed.js

const { PrismaClient } = require("@prisma/client");
const { faker } = require("@faker-js/faker");

const prisma = new PrismaClient();

async function main() {
  const NUM_USERS = 50;
  const POSTS_PER_USER = 3;
  const LIKES_PER_POST = 5;
  const COMMENTS_PER_POST = 2;

  // Reset DB (optional: dangerous in production)
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.friendRequest.deleteMany();
  await prisma.user.deleteMany();

  const users = [];

  // Create users
  for (let i = 0; i < NUM_USERS; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        username: faker.internet.userName(),
        password: faker.internet.password(), // You might want to hash in real apps
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        bio: faker.lorem.sentence(),
        profilePicture: faker.image.avatar(),
      },
    });
    users.push(user);
  }

  const posts = [];

  // Create posts for each user
  for (const user of users) {
    for (let i = 0; i < POSTS_PER_USER; i++) {
      const post = await prisma.post.create({
        data: {
          content: faker.lorem.paragraph(),
          userId: user.id,
        },
      });
      posts.push(post);
    }
  }

  // Add comments to each post
  for (const post of posts) {
    for (let i = 0; i < COMMENTS_PER_POST; i++) {
      const commenter = users[Math.floor(Math.random() * users.length)];
      await prisma.comment.create({
        data: {
          content: faker.lorem.sentence(),
          userId: commenter.id,
          postId: post.id,
        },
      });
    }
  }

  // Add likes to each post
  for (const post of posts) {
    const likedBy = new Set();
    while (likedBy.size < LIKES_PER_POST) {
      const user = users[Math.floor(Math.random() * users.length)];
      if (!likedBy.has(user.id)) {
        likedBy.add(user.id);
        await prisma.like.create({
          data: {
            userId: user.id,
            postId: post.id,
          },
        });
      }
    }
  }

  // Create friend requests (optional)
  for (let i = 0; i < 10; i++) {
    const sender = users[Math.floor(Math.random() * users.length)];
    let receiver;
    do {
      receiver = users[Math.floor(Math.random() * users.length)];
    } while (receiver.id === sender.id);

    await prisma.friendRequest.create({
      data: {
        senderId: sender.id,
        receiverId: receiver.id,
        status: faker.helpers.arrayElement(["pending", "accepted", "declined"]),
      },
    });
  }

  console.log("✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
