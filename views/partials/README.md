# Reusable Components

This directory contains reusable EJS components that can be included across different views to reduce code duplication and improve maintainability.

## Components Overview

### 1. User Avatar (`user-avatar.ejs`)
**Purpose**: Renders user profile pictures with fallback to initials, supporting Gravatar, Cloudinary, and local uploads.

**Usage**:
```ejs
<%- include('partials/user-avatar', { 
  user: user, 
  size: 'large',        // 'small', 'medium', 'large'
  showOverlay: false,   // Show upload overlay
  clickable: false,     // Make avatar clickable
  id: 'profilePicture'  // Optional ID attribute
}) %>
```

**Features**:
- Automatic profile picture detection (Gravatar, Cloudinary, local)
- Fallback to user initials
- Multiple size options
- Optional upload overlay
- Responsive design

### 2. Flash Messages (`flash-messages.ejs`)
**Purpose**: Displays success, error, and validation messages consistently across all pages.

**Usage**:
```ejs
<%- include('partials/flash-messages') %>
```

**Features**:
- Handles all flash message types automatically
- Bootstrap alert styling
- Dismissible alerts
- Validation error array support

### 3. Header (`header.ejs`)
**Purpose**: Main navigation header with search, friend requests, and user menu.

**Usage**:
```ejs
<%- include('partials/header', { 
  showSearch: true,           // Show search bar
  showFriendRequests: true,   // Show friend requests dropdown
  showUserMenu: true,         // Show user menu
  activePage: 'dashboard'     // Current active page
}) %>
```

**Features**:
- Configurable sections
- Active page highlighting
- Responsive navigation
- Integrated search functionality

### 4. Mobile Navigation (`mobile-nav.ejs`)
**Purpose**: Mobile-specific navigation overlay with full-screen menu.

**Usage**:
```ejs
<%- include('partials/mobile-nav') %>
```

**Features**:
- Full-screen mobile overlay
- User profile display
- Mobile search integration
- Touch-friendly navigation

### 5. Auth Header (`auth-header.ejs`)
**Purpose**: Simple header for authentication pages (login/register).

**Usage**:
```ejs
<%- include('partials/auth-header', { 
  activePage: 'login'  // 'login' or 'register'
}) %>
```

**Features**:
- Clean, minimal design
- Active page indication
- Responsive navigation

### 6. Post Card (`post-card.ejs`)
**Purpose**: Complete post display with actions, comments, and interactions.

**Usage**:
```ejs
<%- include('partials/post-card', { 
  post: post,
  showActions: true,      // Show like/comment/share buttons
  showComments: true,     // Show comments section
  currentUser: user       // Current authenticated user
}) %>
```

**Features**:
- Complete post functionality
- Like/comment system
- Photo support
- User actions (edit/delete)
- Comment management

### 7. Friend Request Item (`friend-request-item.ejs`)
**Purpose**: Individual friend request display with accept/decline actions.

**Usage**:
```ejs
<%- include('partials/friend-request-item', { 
  request: request,
  currentUser: user,
  showActions: true       // Show action buttons
}) %>
```

**Features**:
- Request status indication
- User profile information
- Action buttons (accept/decline/cancel)
- Responsive design

## Benefits of Using Components

1. **Code Reusability**: Write once, use everywhere
2. **Consistency**: Uniform appearance across all pages
3. **Maintainability**: Update one component, affects all instances
4. **Reduced Duplication**: Eliminate copy-paste code
5. **Better Organization**: Clear separation of concerns
6. **Easier Testing**: Test components in isolation

## Best Practices

1. **Always provide fallback values** for optional parameters
2. **Use descriptive parameter names** that are self-documenting
3. **Keep components focused** on a single responsibility
4. **Document usage examples** in component headers
5. **Test components** with different parameter combinations
6. **Maintain backward compatibility** when updating components

## Migration Guide

To use these components in existing views:

1. **Replace duplicate code** with component includes
2. **Update parameter names** to match component expectations
3. **Test functionality** to ensure proper behavior
4. **Remove old code** after successful migration
5. **Update CSS classes** if needed for consistency

## Example Migration

**Before** (duplicated code):
```ejs
<!-- Multiple places with the same avatar logic -->
<% if (user.profilePicture && user.profilePicture.startsWith('http')) { %>
  <img src="<%= user.profilePicture %>" alt="Profile Picture">
<% } else { %>
  <%= user.firstName.charAt(0) %><%= user.lastName.charAt(0) %>
<% } %>
```

**After** (reusable component):
```ejs
<%- include('partials/user-avatar', { user: user, size: 'medium' }) %>
```

This approach makes your codebase more maintainable, consistent, and easier to update in the future.
