# OdinBook - Social Media Clone

A social media web application built with Node.js, Express, EJS, Passport.js, Prisma, and PostgreSQL.

## Features

- User authentication (signup/login/logout)
- Secure password hashing with bcrypt
- Session management
- Modern, responsive UI with Bootstrap
- PostgreSQL database with Prisma ORM
- Post creation and management
- Like and unlike posts
- Comment on posts
- View who liked a post
- Friend system with friend requests
- Real-time notifications

## Avatar Generation for Seed Data

The seed file uses **Gravatar** to generate profile pictures for users:

### Gravatar Benefits

- Uses email addresses to generate consistent avatars
- Professional geometric patterns with `d=identicon` parameter
- 200px size for optimal quality
- Free and reliable service
- Same email always generates the same avatar

### How It Works

The `getGravatarUrl()` function:

1. Takes the user's email address
2. Creates an MD5 hash of the email (lowercase, trimmed)
3. Generates a Gravatar URL with size=200 and identicon fallback
4. Returns a consistent, professional avatar for each user

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn package manager

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd odinbook
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   - Copy `.env.example` to `.env`
   - Update the database connection string with your PostgreSQL credentials:

   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/odinbook"
   SESSION_SECRET="your-super-secret-session-key-change-this-in-production"
   PORT=3000
   ```

4. **Set up the database**

   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push the schema to your database
   npm run db:push
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## Database Setup

1. **Create a PostgreSQL database**

   ```sql
   CREATE DATABASE odinbook;
   ```

2. **Update the DATABASE_URL in your .env file**

   ```
   DATABASE_URL="postgresql://your_username:your_password@localhost:5432/odinbook"
   ```

3. **Run Prisma commands**
   ```bash
   npm run db:generate
   npm run db:push
   ```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:migrate` - Run database migrations

## Project Structure

```
odinbook/
├── config/
│   └── passport.js          # Passport authentication configuration
├── prisma/
│   └── schema.prisma        # Database schema
├── routes/
│   ├── auth.js              # Authentication routes
│   └── dashboard.js         # Dashboard routes
├── views/
│   ├── layouts/
│   │   └── auth.ejs         # Authentication layout
│   ├── auth/
│   │   ├── login.ejs        # Login page
│   │   └── register.ejs     # Registration page
│   ├── dashboard/
│   │   └── index.ejs        # Dashboard page
│   └── error.ejs            # Error page
├── app.js                   # Main application file
├── package.json             # Dependencies and scripts
└── .env                     # Environment variables
```

## Authentication

The app uses Passport.js with local strategy for authentication. Users can:

- Register with email, username, first name, last name, and password
- Login with email and password
- Logout from their account

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- Input validation with express-validator
- CSRF protection (via session)
- Secure session configuration

## Next Steps

This is the foundation of the social media app. Future features to implement:

- User profiles with profile pictures
- Posts creation and management
- Follow/unfollow functionality
- Like and comment system
- Real-time notifications
- Chat functionality
- Image uploads

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
