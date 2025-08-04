// prisma/seed.js

const { PrismaClient } = require("@prisma/client");
const { faker } = require("@faker-js/faker");
const crypto = require("crypto");
require("dotenv").config();

const prisma = new PrismaClient();

// Function to generate Gravatar URL (no API key needed for avatars)
function getGravatarUrl(email, size = 200) {
  const hash = crypto
    .createHash("md5")
    .update(email.toLowerCase().trim())
    .digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=pg`;
}

// Example: If you need to use the API key for profile data
// function getGravatarProfile(email) {
//   const hash = crypto
//     .createHash("md5")
//     .update(email.toLowerCase().trim())
//     .digest("hex");
//   return `https://www.gravatar.com/${hash}.json`;
// }

async function main() {
  const NUM_USERS = 60;
  const POSTS_PER_USER = 2;
  const TOTAL_COMMENTS = 120;
  const LIKES_PER_POST = 3;

  // Reset DB (optional: dangerous in production)
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.friendRequest.deleteMany();
  await prisma.user.deleteMany();

  // Array of unique bios for 60 users
  const bios = [
    "Passionate software developer who loves building meaningful applications",
    "Coffee enthusiast and amateur photographer capturing life's moments",
    "Fitness junkie who believes in pushing limits and breaking barriers",
    "Bookworm with a love for fantasy novels and epic adventures",
    "Music producer creating beats that make your soul dance",
    "Travel blogger exploring the world one city at a time",
    "Chef by day, food blogger by night - sharing culinary adventures",
    "Yoga instructor spreading peace and mindfulness",
    "Gamer who believes in the power of virtual connections",
    "Artist painting emotions on canvas with every brushstroke",
    "Entrepreneur building the future one startup at a time",
    "Marine biologist studying ocean life and protecting our seas",
    "Teacher inspiring the next generation of thinkers and dreamers",
    "Architect designing spaces that tell stories",
    "Scientist researching cures for tomorrow's challenges",
    "Writer crafting stories that touch hearts and minds",
    "Dancer expressing emotions through movement and rhythm",
    "Engineer solving complex problems with elegant solutions",
    "Doctor dedicated to healing and caring for others",
    "Lawyer fighting for justice and equality",
    "Designer creating beautiful experiences for users",
    "Musician composing melodies that speak to the soul",
    "Athlete pushing physical boundaries and inspiring others",
    "Activist working towards positive change in society",
    "Historian preserving stories of the past for future generations",
    "Psychologist helping people navigate life's challenges",
    "Environmentalist protecting our planet for future generations",
    "Fashion designer creating styles that express individuality",
    "Journalist uncovering truth and sharing important stories",
    "Pilot soaring through skies and connecting continents",
    "Veterinarian caring for our beloved animal companions",
    "Firefighter bravely protecting communities from danger",
    "Police officer serving and protecting with integrity",
    "Nurse providing compassionate care in times of need",
    "Electrician powering our modern world with skill",
    "Plumber ensuring clean water flows through our homes",
    "Carpenter building structures that stand the test of time",
    "Mechanic keeping vehicles running smoothly and safely",
    "Librarian preserving knowledge and fostering learning",
    "Social worker helping families overcome life's obstacles",
    "Counselor guiding people towards mental wellness",
    "Dentist creating healthy smiles and confident people",
    "Optometrist helping people see the world clearly",
    "Pharmacist ensuring safe medication and health advice",
    "Radiologist using technology to diagnose and heal",
    "Surgeon performing life-saving procedures with precision",
    "Anesthesiologist ensuring safe and comfortable procedures",
    "Dermatologist helping people feel confident in their skin",
    "Cardiologist keeping hearts healthy and strong",
    "Neurologist understanding the complexities of the brain",
    "Oncologist fighting cancer with hope and determination",
    "Pediatrician caring for our youngest patients",
    "Geriatrician helping seniors live fulfilling lives",
    "Psychiatrist treating mental health with compassion",
    "Orthopedic surgeon fixing bones and restoring mobility",
    "Urologist addressing men's health with expertise",
    "Gynecologist providing women's healthcare with dignity",
    "Ophthalmologist preserving vision and eye health",
    "ENT specialist caring for ears, nose, and throat",
    "Dermatologist treating skin conditions with care",
    "Rheumatologist managing arthritis and autoimmune conditions",
    "Endocrinologist balancing hormones and metabolism",
    "Gastroenterologist caring for digestive health",
    "Pulmonologist helping people breathe easier",
    "Nephrologist managing kidney health and function",
  ];

  const users = [];

  // Create users with unique bios
  for (let i = 0; i < NUM_USERS; i++) {
    const email = faker.internet.email();
    const username = faker.internet.username();
    const user = await prisma.user.create({
      data: {
        email: email,
        username: username,
        password: faker.internet.password(), // You might want to hash in real apps
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        bio: bios[i],
        profilePicture: getGravatarUrl(email),
        useGravatar: true,
        birthday: faker.date.birthdate({ min: 18, max: 65, mode: "age" }),
        gender: faker.helpers.arrayElement(["male", "female", "non-binary"]),
        location: faker.location.city() + ", " + faker.location.country(),
      },
    });
    users.push(user);
  }

  const posts = [];

  // Create 2 posts for each user
  for (const user of users) {
    for (let i = 0; i < POSTS_PER_USER; i++) {
      const postContent = faker.helpers.arrayElement([
        faker.lorem.paragraph(),
        faker.lorem.sentences(2),
        faker.lorem.paragraphs(1),
        faker.lorem.sentence({ min: 10, max: 20 }),
        faker.lorem.paragraphs(2),
        faker.lorem.sentences(3),
        faker.lorem.paragraphs(1),
        faker.lorem.sentence({ min: 15, max: 25 }),
        faker.lorem.paragraphs(1),
        faker.lorem.sentences(2),
      ]);

      const post = await prisma.post.create({
        data: {
          content: postContent,
          userId: user.id,
        },
      });
      posts.push(post);
    }
  }

  // Add comments to posts (total of 120 comments)
  const totalPosts = posts.length;
  const commentsPerPost = Math.floor(TOTAL_COMMENTS / totalPosts);
  const remainingComments = TOTAL_COMMENTS % totalPosts;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const commentsToAdd = commentsPerPost + (i < remainingComments ? 1 : 0);

    for (let j = 0; j < commentsToAdd; j++) {
      const commenter = users[Math.floor(Math.random() * users.length)];
      const commentContent = faker.helpers.arrayElement([
        faker.lorem.sentence(),
        faker.lorem.sentences(1),
        faker.lorem.sentence({ min: 5, max: 15 }),
        faker.lorem.sentences(2),
        faker.lorem.sentence({ min: 8, max: 20 }),
        faker.lorem.sentences(1),
        faker.lorem.sentence({ min: 6, max: 12 }),
        faker.lorem.sentences(1),
        faker.lorem.sentence({ min: 4, max: 10 }),
        faker.lorem.sentences(1),
      ]);

      await prisma.comment.create({
        data: {
          content: commentContent,
          userId: commenter.id,
          postId: post.id,
        },
      });
    }
  }

  // Add likes to posts (3 likes per post)
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

  // Create friend requests (20 requests)
  for (let i = 0; i < 20; i++) {
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
  console.log(`Created ${NUM_USERS} users with unique bios`);
  console.log(`Created ${posts.length} posts (${POSTS_PER_USER} per user)`);
  console.log(`Created ${TOTAL_COMMENTS} comments distributed across posts`);
  console.log(
    `Created ${
      posts.length * LIKES_PER_POST
    } likes (${LIKES_PER_POST} per post)`
  );
  console.log("Created 20 friend requests");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
