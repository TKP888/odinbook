const { PrismaClient } = require("@prisma/client");
require("dotenv").config();
require("dotenv").config({ path: ".env.local" });

// Local database (your current .env)
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // This should be your local database
    },
  },
});

// Railway database (you'll need to set this)
const railwayPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.RAILWAY_DATABASE_URL, // You'll set this
    },
  },
});

async function transferData() {
  try {
    console.log("Starting database transfer...");

    // Transfer users
    console.log("Transferring users...");
    const users = await localPrisma.user.findMany();
    for (const user of users) {
      await railwayPrisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user,
      });
    }
    console.log(`Transferred ${users.length} users`);

    // Transfer posts
    console.log("Transferring posts...");
    const posts = await localPrisma.post.findMany();
    for (const post of posts) {
      await railwayPrisma.post.upsert({
        where: { id: post.id },
        update: post,
        create: post,
      });
    }
    console.log(`Transferred ${posts.length} posts`);

    // Transfer friend requests
    console.log("Transferring friend requests...");
    const friendRequests = await localPrisma.friendRequest.findMany();
    for (const request of friendRequests) {
      await railwayPrisma.friendRequest.upsert({
        where: { id: request.id },
        update: request,
        create: request,
      });
    }
    console.log(`Transferred ${friendRequests.length} friend requests`);

    // Transfer likes
    console.log("Transferring likes...");
    const likes = await localPrisma.like.findMany();
    for (const like of likes) {
      await railwayPrisma.like.upsert({
        where: { id: like.id },
        update: like,
        create: like,
      });
    }
    console.log(`Transferred ${likes.length} likes`);

    // Transfer comments
    console.log("Transferring comments...");
    const comments = await localPrisma.comment.findMany();
    for (const comment of comments) {
      await railwayPrisma.comment.upsert({
        where: { id: comment.id },
        update: comment,
        create: comment,
      });
    }
    console.log(`Transferred ${comments.length} comments`);

    console.log("Database transfer completed successfully!");
  } catch (error) {
    console.error("Error during transfer:", error);
  } finally {
    await localPrisma.$disconnect();
    await railwayPrisma.$disconnect();
  }
}

transferData();
