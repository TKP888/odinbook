# Post Components System

This directory contains reusable post components that can be used across different pages to maintain consistency and reduce duplication.

## Components Overview

### 1. `post-create.ejs` - Post Creation Form
A reusable form component for creating posts with optional photo upload.

**Usage:**
```ejs
<%- include('layouts/components/post-create', { 
  user: user, 
  formId: 'inlineCreatePostForm', 
  textareaId: 'inlinePostContent', 
  photoId: 'postPhoto', 
  buttonId: 'inlineCreatePostBtn',
  charCountId: 'inlineCharCount',
  placeholder: 'What\'s on your mind, ' + user.firstName + '?',
  maxLength: 250,
  showPhotoUpload: true,
  showCharCount: true,
  onSubmit: 'createInlinePost()'
}) %>
```

**Parameters:**
- `user`: Current user object
- `formId`: Unique ID for the form
- `textareaId`: Unique ID for the textarea
- `photoId`: Unique ID for the photo input
- `buttonId`: Unique ID for the submit button
- `charCountId`: Unique ID for the character counter
- `placeholder`: Placeholder text for the textarea
- `maxLength`: Maximum character limit
- `showPhotoUpload`: Whether to show photo upload (default: true)
- `showCharCount`: Whether to show character counter (default: true)
- `onSubmit`: JavaScript function to call on submit

### 2. `post-display.ejs` - Individual Post Display
A component for displaying individual posts with actions, comments, and user interactions.

**Usage:**
```ejs
<%- include('layouts/components/post-display', { 
  post: post, 
  currentUser: user,
  showActions: true, 
  showComments: true,
  showUserActions: true,
  showLikes: true,
  showShare: true,
  showEditDelete: true,
  compact: false
}) %>
```

**Parameters:**
- `post`: Post object to display
- `currentUser`: Current authenticated user
- `showActions`: Show like/comment/share buttons (default: true)
- `showComments`: Show comments section (default: true)
- `showUserActions`: Show user-specific actions (default: true)
- `showLikes`: Show like functionality (default: true)
- `showShare`: Show share button (default: true)
- `showEditDelete`: Show edit/delete for post owner (default: true)
- `compact`: Use compact layout (default: false)

### 3. `post-modal.ejs` - Post Creation/Edit Modal
A modal component for creating or editing posts.

**Usage:**
```ejs
<%- include('layouts/components/post-modal', { 
  modalId: 'createPostModal',
  modalTitle: 'Create New Post',
  formId: 'createPostForm',
  textareaId: 'postContent',
  photoId: 'postPhoto',
  buttonId: 'createPostBtn',
  buttonText: 'Post',
  onSubmit: 'createPost()',
  isEdit: false,
  post: null
}) %>
```

**Parameters:**
- `modalId`: Unique ID for the modal
- `modalTitle`: Title displayed in modal header
- `formId`: Unique ID for the form
- `textareaId`: Unique ID for the textarea
- `photoId`: Unique ID for the photo input
- `buttonId`: Unique ID for the submit button
- `buttonText`: Text to display on the submit button
- `onSubmit`: JavaScript function to call on submit
- `isEdit`: Whether this is an edit modal (default: false)
- `post`: Post object for editing (required if isEdit is true)

### 4. `post-feed.ejs` - Posts Feed Container
A container component for displaying a feed of posts with loading states and pagination.

**Usage:**
```ejs
<%- include('layouts/components/post-feed', { 
  posts: posts,
  currentUser: user,
  showActions: true,
  showComments: true,
  showUserActions: true,
  showLikes: true,
  showShare: true,
  showEditDelete: true,
  showRefresh: true,
  showLoadMore: true,
  showNoPosts: true,
  noPostsMessage: 'No posts to show',
  noPostsSubMessage: 'Add some friends to see their posts in your feed!',
  postsPerPage: 10,
  currentPage: 1
}) %>
```

**Parameters:**
- `posts`: Array of posts to display
- `currentUser`: Current authenticated user
- `showActions`: Show post actions (default: true)
- `showComments`: Show comments (default: true)
- `showUserActions`: Show user-specific actions (default: true)
- `showLikes`: Show like functionality (default: true)
- `showShare`: Show share functionality (default: true)
- `showEditDelete`: Show edit/delete for post owners (default: true)
- `showRefresh`: Show refresh button (default: true)
- `showLoadMore`: Show load more button (default: true)
- `showNoPosts`: Show no posts message (default: true)
- `noPostsMessage`: Message when no posts exist
- `noPostsSubMessage`: Subtitle for no posts message
- `postsPerPage`: Number of posts per page (default: 10)
- `currentPage`: Current page number (default: 1)

### 5. `welcome-section.ejs` - Welcome Section with Create Post
A welcome section that optionally includes a create post form.

**Usage:**
```ejs
<%- include('layouts/components/welcome-section', { 
  user: user,
  title: 'Welcome back, ' + user.firstName + '!',
  subtitle: null,
  showCreatePost: true,
  createPostConfig: {
    formId: 'inlineCreatePostForm',
    textareaId: 'inlinePostContent',
    photoId: 'postPhoto',
    buttonId: 'inlineCreatePostBtn',
    charCountId: 'inlineCharCount',
    placeholder: 'What\'s on your mind, ' + user.firstName + '?',
    maxLength: 250,
    showPhotoUpload: true,
    showCharCount: true,
    onSubmit: 'createInlinePost()'
  }
}) %>
```

**Parameters:**
- `user`: Current user object
- `title`: Welcome message title
- `subtitle`: Optional subtitle text
- `showCreatePost`: Whether to show create post form (default: true)
- `createPostConfig`: Configuration object for the create post component

## Migration Guide

### From Dashboard
Replace the existing post creation section with:
```ejs
<%- include('layouts/components/welcome-section', { 
  user: user,
  showCreatePost: true,
  createPostConfig: {
    formId: 'inlineCreatePostForm',
    textareaId: 'inlinePostContent',
    photoId: 'postPhoto',
    buttonId: 'inlineCreatePostBtn',
    charCountId: 'inlineCharCount',
    placeholder: 'What\'s on your mind, ' + user.firstName + '?',
    maxLength: 250,
    showPhotoUpload: true,
    showCharCount: true,
    onSubmit: 'createInlinePost()'
  }
}) %>
```

### From Profile Page
Replace the existing post creation section with:
```ejs
<%- include('layouts/components/welcome-section', { 
  user: user,
  title: 'Create New Post',
  showCreatePost: true,
  createPostConfig: {
    formId: 'inlineCreatePostForm',
    textareaId: 'inlinePostContent',
    photoId: 'inlinePostPhoto',
    buttonId: 'inlineCreatePostBtn',
    charCountId: 'inlineCharCount',
    placeholder: 'What\'s on your mind, ' + user.firstName + '?',
    maxLength: 250,
    showPhotoUpload: true,
    showCharCount: true,
    onSubmit: 'createInlinePost()'
  }
}) %>
```

## Benefits

1. **Consistency**: All post-related UI elements look and behave the same way
2. **Maintainability**: Update one component to update everywhere
3. **Reusability**: Use the same components across different pages
4. **Flexibility**: Configure components with different options for different use cases
5. **Testing**: Test components in isolation
6. **Performance**: Reduce duplicate HTML and CSS

## Future Enhancements

- Add more post types (video, link, poll)
- Add post templates
- Add post scheduling
- Add post analytics
- Add post moderation tools
