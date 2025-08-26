# Post Create V2 Component

## Overview

The Post Create V2 component is a completely redesigned, mobile-first post creation interface that provides an enhanced user experience across all devices. Built with modern web standards and accessibility in mind.

## Features

### 🎨 **Modern Design**

- Beautiful gradient backgrounds and smooth animations
- Card-based layout with subtle shadows and rounded corners
- Consistent color scheme matching the app's brand
- Dark mode support (future enhancement)

### 📱 **Mobile-First Responsive Design**

- Optimized for touch interactions on mobile devices
- Adaptive layout that works perfectly on all screen sizes
- Touch-friendly button sizes (minimum 44px)
- Responsive typography and spacing

### ⚡ **Enhanced Functionality**

- Auto-resizing textarea that grows with content
- Real-time character counter with visual feedback
- Photo upload with drag & drop support
- Image preview with remove functionality
- Loading states and smooth transitions

### ♿ **Accessibility Features**

- Full keyboard navigation support
- Screen reader compatible
- High contrast mode support
- Reduced motion support for users with vestibular disorders
- Focus indicators and proper ARIA labels

### 🚀 **Performance Optimized**

- Lightweight CSS with efficient selectors
- Minimal JavaScript footprint
- Optimized animations using CSS transforms
- Lazy loading for images

## Usage

### Basic Implementation

```ejs
<%- include('layouts/components/post-create-v2', {
  user: user,
  formId: 'createPostFormV2',
  textareaId: 'postContentV2',
  photoId: 'postPhotoV2',
  buttonId: 'createPostBtnV2',
  charCountId: 'charCountV2',
  placeholder: 'What\'s on your mind, ' + user.firstName + '?',
  maxLength: 250,
  showPhotoUpload: true,
  showCharCount: true,
  onSubmit: 'createPostV2()'
}) %>
```

### Parameters

| Parameter         | Type    | Required | Description                                       |
| ----------------- | ------- | -------- | ------------------------------------------------- |
| `user`            | Object  | Yes      | User object containing user information           |
| `formId`          | String  | Yes      | Unique ID for the form element                    |
| `textareaId`      | String  | Yes      | Unique ID for the textarea element                |
| `photoId`         | String  | Yes      | Unique ID for the photo input element             |
| `buttonId`        | String  | Yes      | Unique ID for the submit button                   |
| `charCountId`     | String  | Yes      | Unique ID for the character counter               |
| `placeholder`     | String  | Yes      | Placeholder text for the textarea                 |
| `maxLength`       | Number  | Yes      | Maximum character limit                           |
| `showPhotoUpload` | Boolean | No       | Whether to show photo upload (default: true)      |
| `showCharCount`   | Boolean | No       | Whether to show character counter (default: true) |
| `onSubmit`        | String  | Yes      | JavaScript function to call on submit             |

## File Structure

```
views/layouts/components/
├── post-create-v2.ejs          # Main component template
└── README-V2.md               # This documentation

public/css/
└── post-create-v2.css         # Component styles

public/js/
└── post-create-v2.js          # Component functionality
```

## CSS Classes

### Main Container

- `.post-create-v2-component` - Main component wrapper
- `.post-create-header` - Header section with welcome message
- `.post-create-content` - Main content area

### Layout Elements

- `.post-input-row` - Container for avatar and textarea
- `.user-avatar-container` - Avatar wrapper
- `.text-input-container` - Textarea wrapper
- `.post-actions-row` - Container for buttons and counter

### Interactive Elements

- `.post-textarea` - Main text input
- `.photo-upload-btn` - Photo upload button
- `.post-submit-btn` - Submit button
- `.char-counter` - Character counter display

### States

- `.char-counter.warning` - Warning state (≤50 chars remaining)
- `.char-counter.danger` - Danger state (≤0 chars remaining)
- `.post-loading-overlay` - Loading state overlay

## JavaScript API

### Global Functions

```javascript
// Create a new post
createPostV2();

// Trigger photo upload
triggerPhotoUpload(photoInputId);

// Remove selected photo
removePhotoV2(photoInputId);
```

### Class Methods

```javascript
// Initialize component
const postCreate = new PostCreateV2();

// Update character counter
postCreate.updateCharacterCounter();

// Show/hide loading state
postCreate.showLoadingState(show);

// Reset form to initial state
postCreate.resetForm();

// Show notification
postCreate.showNotification(message, type);
```

## Responsive Breakpoints

| Breakpoint    | Screen Size     | Layout Changes                          |
| ------------- | --------------- | --------------------------------------- |
| Mobile        | ≤ 480px         | Stacked layout, full-width buttons      |
| Mobile        | ≤ 768px         | Horizontal layout with smaller elements |
| Tablet        | 769px - 1024px  | Optimized spacing and sizing            |
| Desktop       | 1025px - 1440px | Full horizontal layout                  |
| Large Desktop | ≥ 1440px        | Maximum width with enhanced spacing     |

## Browser Support

- **Modern Browsers**: Chrome 60+, Firefox 60+, Safari 12+, Edge 79+
- **Mobile Browsers**: iOS Safari 12+, Chrome Mobile 60+
- **Features Used**: CSS Grid, Flexbox, CSS Custom Properties, ES6+

## Testing

### Test Page

Visit `/dashboard/test-post-create-v2` to test the component with:

- Responsive design testing
- Functionality verification
- Accessibility testing
- Cross-browser compatibility

### Manual Testing Checklist

- [ ] Textarea auto-resizes correctly
- [ ] Character counter updates in real-time
- [ ] Photo upload works with preview
- [ ] Form submission handles errors gracefully
- [ ] Loading states display properly
- [ ] Responsive design works on all screen sizes
- [ ] Keyboard navigation functions correctly
- [ ] Screen reader compatibility
- [ ] Touch interactions work on mobile

## Migration from V1

### Key Differences

1. **Layout**: V2 uses a more modern card-based design
2. **Responsiveness**: V2 is truly mobile-first with better breakpoints
3. **Accessibility**: V2 has comprehensive accessibility features
4. **Performance**: V2 is more optimized and lightweight
5. **Maintainability**: V2 has cleaner, more organized code

### Migration Steps

1. Replace the include statement with the V2 version
2. Update CSS imports to include `post-create-v2.css`
3. Update JavaScript imports to include `post-create-v2.js`
4. Test functionality and responsive behavior
5. Remove old V1 files once migration is complete

## Future Enhancements

- [ ] Dark mode support
- [ ] Drag & drop file upload
- [ ] Image editing capabilities
- [ ] Emoji picker integration
- [ ] Mention system (@username)
- [ ] Hashtag support (#hashtag)
- [ ] Draft auto-save functionality
- [ ] Voice-to-text input
- [ ] Advanced image compression

## Support

For issues or questions regarding the Post Create V2 component:

1. Check the test page for functionality verification
2. Review browser console for JavaScript errors
3. Verify all required parameters are provided
4. Test responsive behavior across different screen sizes
