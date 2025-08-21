const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testSpecificUsers() {
  try {
    console.log("🔍 Testing for posts from specific users mentioned in the issue\n");
    
    // Check for posts from "Toy Kohler" (Madelyn.Schmeler)
    console.log("=== CHECKING TOY KOHLER (Madelyn.Schmeler) ===");
    const toyKohlerPosts = await prisma.post.findMany({
      where: {
        user: {
          username: "Madelyn.Schmeler"
        }
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
      },
    });
    
    console.log(`📝 Posts from Toy Kohler: ${toyKohlerPosts.length}`);
    toyKohlerPosts.forEach((post, index) => {
      console.log(`   ${index + 1}. ${post.content.substring(0, 100)}...`);
      console.log(`      Posted by: ${post.user.username} (${post.user.firstName} ${post.user.lastName})`);
      console.log(`      User ID: ${post.user.id}`);
      console.log(`      Post ID: ${post.id}`);
      console.log(`      Created: ${post.createdAt}`);
      console.log("");
    });
    
    // Check for posts from "Declan Connelly" (Tristian.VonRueden)
    console.log("=== CHECKING DECLAN CONNELLY (Tristian.VonRueden) ===");
    const declanConnellyPosts = await prisma.post.findMany({
      where: {
        user: {
          username: "Tristian.VonRueden"
        }
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
      },
    });
    
    console.log(`📝 Posts from Declan Connelly: ${declanConnellyPosts.length}`);
    declanConnellyPosts.forEach((post, index) => {
      console.log(`   ${index + 1}. ${post.content.substring(0, 100)}...`);
      console.log(`      Posted by: ${post.user.username} (${post.user.firstName} ${post.user.lastName})`);
      console.log(`      User ID: ${post.user.id}`);
      console.log(`      Post ID: ${post.id}`);
      console.log(`      Created: ${post.createdAt}`);
      console.log("");
    });
    
    // Check if these users exist and their friendship status
    console.log("=== CHECKING USER EXISTENCE AND FRIENDSHIP STATUS ===");
    
    const toyKohlerUser = await prisma.user.findUnique({
      where: { username: "Madelyn.Schmeler" },
      select: { 
        id: true, 
        username: true, 
        firstName: true, 
        lastName: true,
        email: true,
        createdAt: true
      }
    });
    
    const declanConnellyUser = await prisma.user.findUnique({
      where: { username: "Tristian.VonRueden" },
      select: { 
        id: true, 
        username: true, 
        firstName: true, 
        lastName: true,
        email: true,
        createdAt: true
      }
    });
    
    if (toyKohlerUser) {
      console.log(`👤 Toy Kohler found:`);
      console.log(`   Username: ${toyKohlerUser.username}`);
      console.log(`   Name: ${toyKohlerUser.firstName} ${toyKohlerUser.lastName}`);
      console.log(`   Email: ${toyKohlerUser.email}`);
      console.log(`   ID: ${toyKohlerUser.id}`);
      console.log(`   Created: ${toyKohlerUser.createdAt}`);
    } else {
      console.log("❌ Toy Kohler (Madelyn.Schmeler) not found in database");
    }
    
    if (declanConnellyUser) {
      console.log(`\n👤 Declan Connelly found:`);
      console.log(`   Username: ${declanConnellyUser.username}`);
      console.log(`   Name: ${declanConnellyUser.firstName} ${declanConnellyUser.lastName}`);
      console.log(`   Email: ${declanConnellyUser.email}`);
      console.log(`   ID: ${declanConnellyUser.id}`);
      console.log(`   Created: ${declanConnellyUser.createdAt}`);
    } else {
      console.log("❌ Declan Connelly (Tristian.VonRueden) not found in database");
    }
    
    // Check if these users have any friendship relationships
    if (toyKohlerUser) {
      console.log(`\n🔗 Checking Toy Kohler's friendships...`);
      const toyKohlerFriendships = await prisma.user.findUnique({
        where: { id: toyKohlerUser.id },
        select: {
          friends: { select: { id: true, username: true } },
          friendOf: { select: { id: true, username: true } }
        }
      });
      
      console.log(`   Outgoing friends: ${toyKohlerFriendships?.friends?.length || 0}`);
      console.log(`   Incoming friends: ${toyKohlerFriendships?.friendOf?.length || 0}`);
    }
    
    if (declanConnellyUser) {
      console.log(`\n🔗 Checking Declan Connelly's friendships...`);
      const declanConnellyFriendships = await prisma.user.findUnique({
        where: { id: declanConnellyUser.id },
        select: {
          friends: { select: { id: true, username: true } },
          friendOf: { select: { id: true, username: true } }
        }
      });
      
      console.log(`   Outgoing friends: ${declanConnellyFriendships?.friends?.length || 0}`);
      console.log(`   Incoming friends: ${declanConnellyFriendships?.friendOf?.length || 0}`);
    }
    
  } catch (error) {
    console.error("❌ Error testing specific users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSpecificUsers();
