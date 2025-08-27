# Partials Directory

This directory contains reusable EJS partial components for the OdinBook application.

## Components

### post-actions.ejs
A reusable component for post action buttons (like, comment, share).

**Usage:**
```ejs
<%- include('post-actions', { post: post, currentUser: currentUser }) %>
```

**Features:**
- Clean icon-only design (heart for like, comment icon for comment)
- Responsive design for both desktop and mobile
- Hover effects and animations
- Accessible with tooltips
- Consistent styling across the application

**Props:**
- `post`: The post object containing likes, comments, and other data
- `currentUser`: The current authenticated user

**Styling:**
- Uses `post-actions.css` for consistent styling
- Responsive design with mobile-first approach
- Smooth hover animations and transitions

### post-card.ejs
The main post display component that includes the post-actions component.

**Usage:**
```ejs
<%- include('post-card', { 
  post: post, 
  showActions: true, 
  showComments: true, 
  currentUser: user 
}) %>
```

### user-avatar.ejs
User avatar component with different size options.

### friend-request-item.ejs
Component for displaying friend request items.

### header.ejs
Main navigation header component.

### flash-messages.ejs
Component for displaying flash messages and notifications.

## Styling

All components use the consolidated CSS framework with additional component-specific styles:
- `post-actions.css` - Specific styles for the post actions component
- Responsive design with mobile-first approach
- Consistent with the overall application design system
