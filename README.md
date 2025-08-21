# OdinBook - Social Media Clone

A social media clone built with Node.js, Express, EJS, and PostgreSQL, now reorganized for better maintainability and scalability.

## 🚀 New Architecture Overview

The codebase has been completely reorganized to follow modern best practices:

### 📁 Directory Structure

```
odinbook/
├── src/                          # Source code
│   ├── app.js                   # Main application entry point
│   ├── middleware/              # Authentication & validation middleware
│   │   ├── auth.js             # Authentication middleware
│   │   └── validation.js       # Input validation middleware
│   ├── services/                # Business logic layer
│   │   ├── postService.js      # Post-related operations
│   │   ├── friendService.js    # Friend-related operations
│   │   └── userService.js      # User-related operations
│   ├── routes/                  # Route handlers (thin controllers)
│   │   ├── posts.js            # Post routes
│   │   ├── friends.js          # Friend routes
│   │   ├── auth.js             # Authentication routes
│   │   ├── profile.js          # Profile routes
│   │   ├── dashboard.js        # Dashboard routes
│   │   └── messages.js         # Message routes
│   ├── utils/                   # Utility functions
│   │   ├── avatarUtils.js      # Avatar handling utilities
│   │   └── notificationUtils.js # Notification utilities
│   └── public/js/modules/      # Frontend JavaScript modules
│       └── postManager.js      # Post management module
├── public/                      # Static assets
├── views/                       # EJS templates
├── prisma/                      # Database schema & migrations
├── config/                      # Configuration files
└── scripts/                     # Build & utility scripts
```

## 🔧 Key Improvements

### 1. **Service Layer Architecture**

- **Separation of Concerns**: Business logic moved from routes to dedicated service classes
- **Reusability**: Services can be used across different routes and contexts
- **Testability**: Business logic is now easily testable in isolation

### 2. **Middleware Organization**

- **Centralized Authentication**: Single source of truth for auth logic
- **Input Validation**: Consistent validation across all endpoints
- **DRY Principle**: No more duplicated middleware code

### 3. **Frontend Modularization**

- **Modular JavaScript**: Large files broken into focused modules
- **Utility Functions**: Common functionality extracted into reusable utilities
- **Better Maintainability**: Easier to find and fix issues

### 4. **Route Simplification**

- **Thin Controllers**: Routes now only handle HTTP concerns
- **Consistent Error Handling**: Standardized error responses
- **Cleaner Code**: Routes are now much more readable

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16.0.0
- PostgreSQL
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd odinbook
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Database Setup**

   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📚 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm run build` - Run linting and tests
- `npm run lint` - Run ESLint
- `npm run test` - Run Jest tests
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

## 🏗️ Architecture Benefits

### **Before (Monolithic)**

- Routes with 600-1000+ lines
- Business logic mixed with HTTP handling
- Duplicated code across files
- Hard to test and maintain
- Difficult to add new features

### **After (Modular)**

- Routes under 100 lines
- Clear separation of concerns
- Reusable service layer
- Easy to test and maintain
- Simple to extend and modify

## 🔄 Migration Guide

If you're upgrading from the old structure:

1. **Update imports** in your existing files to use the new structure
2. **Move business logic** from routes to appropriate services
3. **Update frontend JavaScript** to use the new utility modules
4. **Test thoroughly** to ensure all functionality works as expected

## 🧪 Testing

The new structure makes testing much easier:

```javascript
// Example: Testing a service
const postService = require("../services/postService");

describe("PostService", () => {
  test("should create a post", async () => {
    const post = await postService.createPost(userId, "Test content");
    expect(post.content).toBe("Test content");
  });
});
```

## 🚀 Deployment

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Set environment variables** for production
3. **Start the server**
   ```bash
   npm start
   ```

## 🤝 Contributing

1. Follow the new modular structure
2. Add business logic to services, not routes
3. Use the provided middleware for auth and validation
4. Keep routes thin and focused on HTTP concerns
5. Write tests for new functionality

## 📝 Code Style

- Use ES6+ features
- Follow the established service layer pattern
- Keep functions small and focused
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

## 🔍 Troubleshooting

### Common Issues

1. **Module not found errors**: Ensure you're importing from the correct paths
2. **Database connection issues**: Check your `.env` file and database status
3. **Frontend errors**: Make sure utility modules are loaded before using them

### Getting Help

- Check the console for detailed error messages
- Review the service layer for business logic issues
- Ensure all middleware is properly configured

## 📈 Performance Improvements

The new structure provides several performance benefits:

- **Reduced memory usage** through better code organization
- **Faster development** with clearer code structure
- **Easier debugging** with focused modules
- **Better caching** opportunities with service layer

## 🔮 Future Enhancements

With the new structure, it's easy to add:

- **API versioning**
- **Rate limiting**
- **Caching layer**
- **WebSocket support**
- **Microservices architecture**

---

**Note**: This reorganization maintains 100% backward compatibility while providing a much more maintainable and scalable foundation for future development.
