// Initialize modals
let createPostModal;
let editPostModal;

// Get current user ID from the page
const currentUserId = document
  .querySelector('meta[name="user-id"]')
  ?.getAttribute("content");

// Log currentUserId for debugging
console.log("Current User ID:", currentUserId);

// Global variables for pagination
let currentPage = 1;
let hasNextPage = true;
let isLoading = false;

// ========================================
// MOBILE DROPDOWN ENHANCEMENTS
// ========================================

// Function to close all dropdowns
function closeAllDropdowns() {
  document.querySelectorAll(".dropdown-menu.show").forEach((menu) => {
    menu.classList.remove("show");
  });
}

// Simple function to toggle dropdown manually
function toggleDropdown(button) {
  const dropdown = button.nextElementSibling;
  if (dropdown && dropdown.classList.contains("dropdown-menu")) {
    const isOpen = dropdown.classList.contains("show");

    // Close all other dropdowns first
    closeAllDropdowns();

    // Toggle current dropdown
    if (!isOpen) {
      dropdown.classList.add("show");
    }
  }
}

// Close dropdowns when clicking outside
document.addEventListener("click", function (e) {
  if (!e.target.closest(".dropdown")) {
    closeAllDropdowns();
  }
});

// ========================================
// MOBILE DETECTION & RESPONSIVE POST GENERATION
// ========================================

// Function to detect if user is on mobile
function isMobileDevice() {
  // Check multiple conditions for mobile detection
  const screenWidth = window.innerWidth;
  const userAgent = navigator.userAgent.toLowerCase();

  // Primary check: screen width
  const isMobileByWidth = screenWidth <= 767;

  // Secondary check: user agent
  const isMobileByAgent = /mobile|android|iphone|ipad|phone|tablet/i.test(
    userAgent
  );

  // Final decision: prioritize screen width but consider user agent
  const isMobile = isMobileByWidth || (screenWidth <= 1024 && isMobileByAgent);

  console.log(
    `[DASHBOARD] isMobileDevice() called: ${isMobile} (width: ${screenWidth}px, agent: ${userAgent.substring(
      0,
      50
    )}...)`
  );
  return isMobile;
}

// Function to generate mobile-optimized post actions
function generateMobilePostActions(post, currentUserId) {
  console.log(
    `[DASHBOARD] generateMobilePostActions called for post ${post.id}`
  );
  const isLiked = post.likes.some((like) => like.user.id === currentUserId);
  const likeButtonClass = isLiked ? "liked" : "btn-outline-primary";
  const likeIconColor = isLiked ? "red" : "inherit";

  return `
    <div class="post-actions ${
      post.content || post.photoUrl ? "mt-1 pt-1" : "mt-1 pt-1"
    } border-top">
      <div class="d-flex justify-content-between align-items-center">
        <!-- Action Buttons - Mobile: Icon Only -->
        <div class="d-flex gap-2">
          <button class="btn btn-sm ${likeButtonClass} like-btn" id="like-btn-${
    post.id
  }" onclick="likePost('${post.id}')" data-post-id="${post.id}">
            <i class="fas fa-heart" style="color: ${likeIconColor};"></i>
            <span class="like-count">${post.likes.length}</span>
          </button>
          <button class="btn btn-sm btn-outline-secondary" onclick="toggleComments('${
            post.id
          }')">
            <i class="fas fa-comment"></i>
            <span class="comment-count">${post.comments.length}</span>
          </button>
        </div>
        <!-- Counters - Mobile: Hidden since they're in buttons -->
        <div class="text-muted small d-none">
          <span class="likes-count" id="likes-${
            post.id
          }" onclick="showLikesModal('${post.id}')" style="cursor: pointer;">${
    post.likes.length
  } like${post.likes.length !== 1 ? "s" : ""}</span>
          <span class="comments-count ms-2" id="comments-${
            post.id
          }" onclick="toggleComments('${post.id}')" style="cursor: pointer;">${
    post.comments.length
  } comment${post.comments.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  `;
}

// Function to generate desktop post actions (original)
function generateDesktopPostActions(post, currentUserId) {
  console.log(
    `[DASHBOARD] generateDesktopPostActions called for post ${post.id}`
  );
  const isLiked = post.likes.some((like) => like.user.id === currentUserId);
  const likeButtonClass = isLiked ? "liked" : "btn-outline-primary";
  const likeIconColor = isLiked ? "red" : "inherit";

  return `
    <div class="post-actions ${
      post.content || post.photoUrl ? "mt-1 pt-1" : "mt-1 pt-1"
    } border-top">
      <div class="d-flex justify-content-between align-items-center">
        <!-- Action Buttons - Desktop: Full Text -->
        <div class="d-flex gap-2">
          <button class="btn btn-sm ${likeButtonClass} like-btn" id="like-btn-${
    post.id
  }" onclick="likePost('${post.id}')" data-post-id="${post.id}">
            <i class="fas fa-heart" style="color: ${likeIconColor};"></i> ${
    isLiked ? "Liked" : "Like"
  }
          </button>
          <button class="btn btn-sm btn-outline-secondary" onclick="toggleComments('${
            post.id
          }')">
            <i class="fas fa-comment"></i> Comment
          </button>
        </div>
        <!-- Counters - Desktop: Visible -->
        <div class="text-muted small">
          <span class="likes-count" id="likes-${
            post.id
          }" onclick="showLikesModal('${post.id}')" style="cursor: pointer;">${
    post.likes.length
  } like${post.likes.length !== 1 ? "s" : ""}</span>
          <span class="comments-count ms-2" id="comments-${
            post.id
          }" onclick="toggleComments('${post.id}')" style="cursor: pointer;">${
    post.comments.length
  } comment${post.comments.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  `;
}

// ========================================
// EXISTING FUNCTIONS
// ========================================

// Add window resize listener for responsive switching
window.addEventListener("resize", function () {
  // Debounce resize events to avoid excessive updates
  clearTimeout(window.resizeTimeout);
  window.resizeTimeout = setTimeout(function () {
    console.log(
      "[DASHBOARD] Window resized, checking if posts need mobile/desktop update"
    );

    // Check if we need to refresh posts due to layout change
    const wasMobile = window.lastKnownMobileState;
    const isNowMobile = isMobileDevice();

    if (wasMobile !== isNowMobile) {
      console.log(
        `[DASHBOARD] Layout changed from ${
          wasMobile ? "mobile" : "desktop"
        } to ${isNowMobile ? "mobile" : "desktop"}, refreshing posts`
      );
      // Refresh posts to get the correct layout
      if (typeof loadPosts === "function") {
        loadPosts(true);
      }
    }

    // Update the last known state
    window.lastKnownMobileState = isNowMobile;
  }, 250);
});

// Initialize mobile state when page loads
document.addEventListener("DOMContentLoaded", function () {
  window.lastKnownMobileState = isMobileDevice();
  console.log(
    `[DASHBOARD] Initial mobile state: ${window.lastKnownMobileState}`
  );
});

// Function to generate like button HTML
function generateLikeButton(post) {
  const isLiked = post.likes.some((like) => like.user.id === currentUserId);
  const buttonClass = isLiked ? "liked" : "btn-outline-primary";
  const iconColor = isLiked ? "red" : "inherit";
  const buttonText = isLiked ? "Liked" : "Like";

  return `<button class="btn btn-sm ${buttonClass} like-btn" id="like-btn-${post.id}" onclick="likePost('${post.id}')" data-post-id="${post.id}">
    <i class="fas fa-heart" style="color: ${iconColor};"></i> ${buttonText}
  </button>`;
}

// Function to get user avatar (Gravatar or initials)
function getUserAvatar(user) {
  // Check if user uses Gravatar and has email
  if (user.useGravatar && user.email) {
    // Generate Gravatar URL
    const email = user.email.toLowerCase().trim();
    const hash = CryptoJS.MD5(email).toString();
    const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?s=200&d=identicon&r=pg`;
    return `<img src="${gravatarUrl}" alt="Profile Picture" class="profile-image" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
  }
  // If user has a profile picture (including Gravatar URLs), use it
  else if (
    user.profilePicture &&
    (user.profilePicture.startsWith("http") ||
      user.profilePicture.startsWith("/uploads/") ||
      user.profilePicture.includes("cloudinary.com") ||
      user.profilePicture.includes("gravatar.com"))
  ) {
    return `<img src="${user.profilePicture}" alt="Profile Picture" class="profile-image" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
  } else {
    // Fallback to initials
    return `${(user.firstName || "").charAt(0)}${(user.lastName || "").charAt(
      0
    )}`;
  }
}

// Load posts when page loads
document.addEventListener("DOMContentLoaded", function () {
  loadPosts();
  initializeModals();
  initializeInlinePost();
  handlePhotoSelection(); // Add this line
  // initializeMobileDropdowns(); // Initialize mobile dropdown enhancements - REMOVED
});

// Function to refresh posts (force reload)
function refreshPosts() {
  console.log("[DASHBOARD] Refreshing posts...");

  // Clear any cached data
  currentPage = 1;
  hasNextPage = true;

  // Force reload posts
  loadPosts(true);

  // Show feedback to user
  showNotification("Posts refreshed!", "success");
}

function initializeModals() {
  // Initialize modals
  createPostModal = new bootstrap.Modal(
    document.getElementById("createPostModal")
  );
  editPostModal = new bootstrap.Modal(document.getElementById("editPostModal"));

  // Character count for create post textarea
  const postContent = document.getElementById("postContent");
  if (postContent) {
    postContent.addEventListener("input", function () {
      const text = this.value;
      const charCount = text.length;
      document.getElementById("charCount").textContent = charCount;

      // Update character count color
      const charCountElement = document.getElementById("charCount");
      if (charCount > 900) {
        charCountElement.style.color = "#dc3545";
      } else if (charCount > 800) {
        charCountElement.style.color = "#ffc107";
      } else {
        charCountElement.style.color = "#6c757d";
      }
    });
  }

  // Character count for edit post textarea
  const editPostContent = document.getElementById("editPostContent");
  if (editPostContent) {
    editPostContent.addEventListener("input", function () {
      const text = this.value;
      const charCount = text.length;
      document.getElementById("editCharCount").textContent = charCount;

      // Update character count color
      const charCountElement = document.getElementById("editCharCount");
      if (charCount > 900) {
        charCountElement.style.color = "#dc3545";
      } else if (charCount > 800) {
        charCountElement.style.color = "#ffc107";
      } else {
        charCountElement.style.color = "#6c757d";
      }
    });
  }

  // Character count for edit comment textarea
  const editCommentContent = document.getElementById("editCommentContent");
  if (editCommentContent) {
    editCommentContent.addEventListener("input", function () {
      const text = this.value;
      const charCount = text.length;
      document.getElementById("editCommentCharCount").textContent = charCount;

      // Update character count color
      const charCountElement = document.getElementById("editCommentCharCount");
      if (charCount > 200) {
        charCountElement.style.color = "#dc3545";
      } else if (charCount > 150) {
        charCountElement.style.color = "#ffc107";
      } else {
        charCountElement.style.color = "#6c757d";
      }
    });
  }
}

function initializeInlinePost() {
  // Character count for inline post textarea
  const inlinePostContent = document.getElementById("inlinePostContent");
  if (inlinePostContent) {
    inlinePostContent.addEventListener("input", function () {
      const text = this.value;
      const charCount = text.length;
      document.getElementById("inlineCharCount").textContent = charCount;

      // Update character count color
      const charCountElement = document.getElementById("inlineCharCount");
      if (charCount > 200) {
        charCountElement.style.color = "#dc3545";
      } else if (charCount > 150) {
        charCountElement.style.color = "#ffc107";
      } else {
        charCountElement.style.color = "#6c757d";
      }
    });

    // Handle Enter key to submit
    inlinePostContent.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        createInlinePost();
      }
    });
  }
}

function openCreatePostModal() {
  document.getElementById("postContent").value = "";
  document.getElementById("charCount").textContent = "0";
  document.getElementById("charCount").style.color = "#6c757d";
  createPostModal.show();
}

function createInlinePost() {
  const content = document.getElementById("inlinePostContent").value.trim();
  const photoFile = document.getElementById("postPhoto").files[0];

  // Allow posts with just photos (no text required)
  if (!content && !photoFile) {
    showNotification(
      "Please add some content or a photo to your post.",
      "warning"
    );
    return;
  }

  if (content && content.length > 250) {
    showNotification("Post content cannot exceed 250 characters.", "warning");
    return;
  }

  const createPostBtn = document.getElementById("inlineCreatePostBtn");
  const originalText = createPostBtn.innerHTML;
  createPostBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
  createPostBtn.disabled = true;

  // Use FormData for file uploads
  const formData = new FormData();
  if (content) {
    formData.append("content", content);
  }
  if (photoFile) {
    formData.append("photo", photoFile);
  }

  fetch("/posts", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        // Clear the form
        document.getElementById("inlinePostContent").value = "";
        document.getElementById("inlineCharCount").textContent = "0";
        document.getElementById("inlineCharCount").style.color = "#6c757d";

        // Clear photo
        removePhoto();

        // Show success notification first
        showNotification("Post created successfully!", "success");

        // Then refresh posts list with error handling and a small delay
        setTimeout(() => {
          console.log(
            "Refreshing posts after successful inline post creation..."
          );
          // Force refresh posts regardless of any errors
          try {
            loadPosts()
              .then(() => {
                console.log(
                  "Posts refreshed successfully after inline post creation"
                );
              })
              .catch((loadError) => {
                console.error("Error refreshing posts:", loadError);
                // Force refresh even if there's an error
                console.log("Forcing posts refresh...");
                setTimeout(() => {
                  loadPosts().catch((retryError) => {
                    console.error("Retry failed:", retryError);
                    // Last resort: force page reload
                    console.log("Forcing page reload as last resort...");
                    window.location.reload();
                  });
                }, 1000);
              });
          } catch (error) {
            console.error("Error in loadPosts:", error);
            // If all else fails, force page reload
            console.log("Forcing page reload due to loadPosts error...");
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        }, 500); // Small delay to ensure post is fully saved
      } else {
        showNotification(data.error || "Failed to create post", "danger");
      }
    })
    .catch((error) => {
      console.error("Error creating post:", error);

      // Check if it's a JSON parsing error that suggests the post was created
      if (
        error.message.includes("Unexpected token") ||
        error.message.includes("JSON") ||
        error.message.includes("<!DOCTYPE")
      ) {
        console.log(
          "Detected HTML response instead of JSON, post may have been created successfully"
        );
        // Force refresh posts since the post was likely created successfully
        setTimeout(() => {
          console.log("Forcing posts refresh due to JSON parsing error...");
          forceRefreshPosts();
        }, 1000);
      } else {
        showNotification("Failed to create post. Please try again.", "danger");
      }
    })
    .finally(() => {
      createPostBtn.innerHTML = originalText;
      createPostBtn.disabled = false;
    });
}

function createPost() {
  const content = document.getElementById("postContent").value.trim();

  if (!content) {
    showNotification("Please enter some content for your post.", "warning");
    return;
  }

  if (content.length > 250) {
    showNotification("Post content cannot exceed 250 characters.", "warning");
    return;
  }

  const createPostBtn = document.getElementById("createPostBtn");
  const originalText = createPostBtn.innerHTML;
  createPostBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
  createPostBtn.disabled = true;

  fetch("/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  })
    .then((response) => {
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        createPostModal.hide();

        // Show success notification first
        showNotification("Post created successfully!", "success");

        // Then refresh posts list with error handling and a small delay
        setTimeout(() => {
          console.log(
            "Refreshing posts after successful modal post creation..."
          );
          // Force refresh posts regardless of any errors
          try {
            loadPosts()
              .then(() => {
                console.log(
                  "Posts refreshed successfully after modal post creation"
                );
              })
              .catch((loadError) => {
                console.error("Error refreshing posts:", loadError);
                // Force refresh even if there's an error
                console.log("Forcing posts refresh...");
                setTimeout(() => {
                  loadPosts().catch((retryError) => {
                    console.error("Retry failed:", retryError);
                    // Last resort: force page reload
                    console.log("Forcing page reload as last resort...");
                    window.location.reload();
                  });
                }, 1000);
              });
          } catch (error) {
            console.error("Error in loadPosts:", error);
            // If all else fails, force page reload
            console.log("Forcing page reload due to loadPosts error...");
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        }, 500); // Small delay to ensure post is fully saved
      } else {
        showNotification(data.error || "Failed to create post", "danger");
      }
    })
    .catch((error) => {
      console.error("Error creating post:", error);

      // Check if it's a JSON parsing error that suggests the post was created
      if (
        error.message.includes("Unexpected token") ||
        error.message.includes("JSON") ||
        error.message.includes("<!DOCTYPE")
      ) {
        console.log(
          "Detected HTML response instead of JSON, post may have been created successfully"
        );
        // Force refresh posts since the post was likely created successfully
        setTimeout(() => {
          console.log("Forcing posts refresh due to JSON parsing error...");
          forceRefreshPosts();
        }, 1000);
      } else {
        showNotification("Failed to create post. Please try again.", "danger");
      }
    })
    .finally(() => {
      createPostBtn.innerHTML = originalText;
      createPostBtn.disabled = false;
    });
}

// Force refresh posts function as fallback
function forceRefreshPosts() {
  console.log("[DASHBOARD] Force refreshing posts...");
  // Simple approach: just reload the page
  window.location.reload();
}

function loadPosts(reset = true) {
  console.log(`[DASHBOARD] loadPosts called with reset: ${reset}`);

  // if (noPosts) {
  //   noPosts.classList.add("d-none");
  // }

  if (isLoading) {
    console.log("[DASHBOARD] Already loading posts, skipping...");
    return Promise.resolve();
  }

  const postsLoading = document.getElementById("postsLoading");
  const postsList = document.getElementById("postsList");
  const noPosts = document.getElementById("noPosts");
  const loadMoreContainer = document.getElementById("loadMoreContainer");

  if (reset) {
    // Reset pagination when loading fresh posts
    currentPage = 1;
    hasNextPage = true;
    postsList.innerHTML = "";
    loadMoreContainer.classList.add("d-none");
  }

  if (!hasNextPage && !reset) return Promise.resolve();

  isLoading = true;
  postsLoading.classList.remove("d-none");
  postsList.classList.remove("d-none");
  noPosts.classList.add("d-none");

  console.log(
    `[DASHBOARD] Loading posts, page: ${currentPage}, reset: ${reset}`
  );

  return fetch(
    `/dashboard/posts?page=${currentPage}&limit=10&_t=${Date.now()}`,
    {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    }
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      postsLoading.classList.add("d-none");
      isLoading = false;

      console.log(`[DASHBOARD] Posts API response:`, data);

      if (data.posts && data.posts.length > 0) {
        console.log(`[DASHBOARD] Displaying ${data.posts.length} posts`);
        if (reset) {
          displayPosts(data.posts);
        } else {
          appendPosts(data.posts);
        }

        // Update pagination state
        hasNextPage = data.pagination.hasNextPage;
        currentPage = data.pagination.currentPage;

        // Show/hide load more button
        updateLoadMoreButton();
      } else if (reset) {
        console.log(`[DASHBOARD] No posts found, showing no posts message`);
        // Show appropriate message based on whether user has friends
        showNoPostsMessage();
      }
    })
    .catch((error) => {
      console.error("Error loading posts:", error);
      postsLoading.classList.add("d-none");
      isLoading = false;
      if (reset) {
        showNoPostsMessage();
      }
      throw error;
    });
}

function displayPosts(posts) {
  const postsList = document.getElementById("postsList");
  const noPosts = document.getElementById("noPosts");

  console.log(`[DASHBOARD] displayPosts called with ${posts.length} posts`);

  if (posts.length === 0) {
    console.log(`[DASHBOARD] No posts to display, showing no posts message`);
    postsList.classList.add("d-none");
    noPosts.classList.remove("d-none");
    return;
  }

  console.log(`[DASHBOARD] Displaying posts, hiding no posts message`);
  console.log(`[DASHBOARD] Posts data:`, posts);
  noPosts.classList.add("d-none");
  postsList.classList.remove("d-none");

  postsList.innerHTML = posts
    .map(
      (post) => `
<div class="post-item mb-4 p-3 border rounded">
  <div class="d-flex align-items-start mb-3">
    <div class="user-avatar-small me-3" style="width: 40px; height: 40px; font-size: 1rem;">
      ${getUserAvatar(post.user)}
    </div>
    <div class="flex-grow-1">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h6 class="mb-1">
            <a href="/profile/${
              post.user.id
            }" class="text-decoration-none fw-bold text-primary">
              ${
                post.user.firstName && post.user.lastName
                  ? `${post.user.firstName} ${post.user.lastName}`
                  : post.user.firstName || post.user.lastName || "User"
              }
            </a>
            <!-- Debug: firstName="${post.user.firstName}", lastName="${
        post.user.lastName
      }" -->
          </h6>
          <div class="d-flex align-items-center gap-2 mb-1">
            <small class="text-muted">
              <a href="/profile/${
                post.user.id
              }" class="text-decoration-none text-muted">@${
        post.user.username
      }</a>
            </small>
            <small class="text-muted">•</small>
            <small class="text-muted">${formatDateTime(post.createdAt)}</small>
          </div>
        </div>
        ${
          post.user.id === currentUserId
            ? `
          <div class="dropdown">
            <button class="btn btn-link btn-sm text-muted dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Post options">
              <i class="fas fa-ellipsis-h"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end" role="menu">
              <li role="none">
                <button class="dropdown-item" role="menuitem" onclick="editPost('${post.id}'); closeAllDropdowns();">
                  <i class="fas fa-edit me-2"></i>Edit
                </button>
              </li>
              <li role="none">
                <button class="dropdown-item text-danger" role="menuitem" onclick="deletePost('${post.id}'); closeAllDropdowns();">
                  <i class="fas fa-trash me-2"></i>Delete
                </button>
              </li>
            </ul>
          </div>
        `
            : ""
        }
      </div>
    </div>
  </div>
  ${
    post.content || post.photoUrl
      ? `<div class="post-content">${
          post.content
            ? `<p>${post.content.replace(
                /\n/g,
                post.photoUrl ? "" : "<br>"
              )}</p>`
            : ""
        }${
          post.photoUrl
            ? `<div class="post-photo"><img src="${post.photoUrl}" alt="Post photo" class="img-fluid rounded" style="width: 100%; max-height: 600px; height: auto; object-fit: contain; object-position: center; cursor: pointer; margin: 0; padding: 0; display: block;" onclick="openPhotoModal('${post.photoUrl}')" /></div>`
            : ""
        }</div>`
      : ""
  }

  <!-- Post Actions -->
  ${
    isMobileDevice()
      ? generateMobilePostActions(post, currentUserId)
      : generateDesktopPostActions(post, currentUserId)
  }

  <!-- Debug Info -->
  <div class="d-none">
    <small class="text-muted">Debug: Mobile=${isMobileDevice()}, Width=${
        window.innerWidth
      }px</small>
  </div>

  <!-- Comments Section -->
  <div class="comments-section mt-3 d-none" id="comments-section-${post.id}">
    <div class="comments-list mb-3" id="comments-list-${post.id}">
      ${
        post.comments && post.comments.length > 0
          ? post.comments
              .map(
                (comment) => `
        <div class="comment-item p-2 border-bottom" data-comment-id="${
          comment.id
        }">
          <div class="d-flex align-items-start">
            <div class="user-avatar-small me-2" style="width: 24px; height: 24px; font-size: 0.7rem;">
              ${getUserAvatar(comment.user)}
            </div>
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <small class="fw-bold">
                    <a href="/profile/${
                      comment.user.id
                    }" class="text-decoration-none">
                      ${comment.user.firstName || ""} ${
                  comment.user.lastName || ""
                }
                    </a>
                  </small>
                  <div class="comment-content">${comment.content}</div>
                  <small class="text-muted">${formatDateTime(
                    comment.createdAt
                  )}</small>
                </div>
                ${
                  comment.user.id === currentUserId
                    ? `
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-sm btn-outline-primary" onclick="editComment('${
                      comment.id
                    }', '${post.id}', '${comment.content.replace(
                        /'/g,
                        "\\'"
                      )}')" title="Edit comment">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteComment('${
                      comment.id
                    }', '${post.id}')" title="Delete comment">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                `
                    : ""
                }
              </div>
            </div>
          </div>
        </div>
      `
              )
              .join("")
          : '<p class="text-muted text-center">No comments yet</p>'
      }
    </div>
    <div class="comment-form">
      <div class="input-group">
        <input type="text" class="form-control form-control-sm" placeholder="Write a comment..." id="comment-input-${
          post.id
        }" onkeypress="handleCommentKeyPress(event, '${post.id}')">
        <button class="btn btn-primary btn-sm" onclick="submitComment('${
          post.id
        }')">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  </div>
</div>
`
    )
    .join("");
}

function appendPosts(posts) {
  console.log(`[DASHBOARD] appendPosts called with:`, posts);
  const postsList = document.getElementById("postsList");
  const postsHTML = posts
    .map(
      (post) => `
<div class="post-item mb-4 p-3 border rounded">
  <div class="d-flex align-items-start mb-3">
    <div class="user-avatar-small me-3" style="width: 40px; height: 40px; font-size: 1rem;">
      ${getUserAvatar(post.user)}
    </div>
    <div class="flex-grow-1">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h6 class="mb-1">
            <a href="/profile/${
              post.user.id
            }" class="text-decoration-none fw-bold text-primary">
              ${
                post.user.firstName && post.user.lastName
                  ? `${post.user.firstName} ${post.user.lastName}`
                  : post.user.firstName || post.user.lastName || "User"
              }
            </a>
          </h6>
          <div class="d-flex align-items-center gap-2 mb-1">
            <small class="text-muted">
              <a href="/profile/${
                post.user.id
              }" class="text-decoration-none text-muted">@${
        post.user.username
      }</a>
            </small>
            <small class="text-muted">•</small>
            <small class="text-muted">${formatDateTime(post.createdAt)}</small>
          </div>
        </div>
        ${
          post.user.id === currentUserId
            ? `
          <div class="dropdown">
            <button class="btn btn-link btn-sm text-muted dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Post options">
              <i class="fas fa-ellipsis-h"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end" role="menu">
              <li role="none">
                <button class="dropdown-item" role="menuitem" onclick="editPost('${post.id}'); closeAllDropdowns();">
                  <i class="fas fa-edit me-2"></i>Edit
                </button>
              </li>
              <li role="none">
                <button class="dropdown-item text-danger" role="menuitem" onclick="deletePost('${post.id}'); closeAllDropdowns();">
                  <i class="fas fa-trash me-2"></i>Delete
                </button>
              </li>
            </ul>
          </div>
        `
            : ""
        }
      </div>
    </div>
  </div>
  ${
    post.content || post.photoUrl
      ? `<div class="post-content">${
          post.content
            ? `<p>${post.content.replace(
                /\n/g,
                post.photoUrl ? "" : "<br>"
              )}</p>`
            : ""
        }${
          post.photoUrl
            ? `<div class="post-photo"><img src="${post.photoUrl}" alt="Post photo" class="img-fluid rounded" style="width: 100%; max-height: 600px; height: auto; object-fit: contain; object-position: center; cursor: pointer; margin: 0; padding: 0; display: block;" onclick="openPhotoModal('${post.photoUrl}')" /></div>`
            : ""
        }</div>`
      : ""
  }

  <!-- Post Actions -->
  ${
    isMobileDevice()
      ? generateMobilePostActions(post, currentUserId)
      : generateDesktopPostActions(post, currentUserId)
  }

  <!-- Debug Info -->
  <div class="d-none">
    <small class="text-muted">Debug: Mobile=${isMobileDevice()}, Width=${
        window.innerWidth
      }px</small>
  </div>

  <!-- Comments Section -->
  <div class="comments-section mt-3 d-none" id="comments-section-${post.id}">
    <div class="comments-list mb-3" id="comments-list-${post.id}">
      ${
        post.comments && post.comments.length > 0
          ? post.comments
              .map(
                (comment) => `
        <div class="comment-item p-2 border-bottom" data-comment-id="${
          comment.id
        }">
          <div class="d-flex align-items-start">
            <div class="user-avatar-small me-2" style="width: 24px; height: 24px; font-size: 0.7rem;">
              ${getUserAvatar(comment.user)}
            </div>
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <small class="fw-bold">
                    <a href="/profile/${
                      comment.user.id
                    }" class="text-decoration-none">
                      ${comment.user.firstName || ""} ${
                  comment.user.lastName || ""
                }
                    </a>
                  </small>
                  <div class="comment-content">${comment.content}</div>
                  <small class="text-muted">${formatDateTime(
                    comment.createdAt
                  )}</small>
                </div>
                ${
                  comment.user.id === currentUserId
                    ? `
              <div class="btn-group btn-group-sm">
                <button class="btn btn-sm btn-outline-primary" onclick="editComment('${
                  comment.id
                }', '${post.id}', '${comment.content.replace(
                        /'/g,
                        "\\'"
                      )}')" title="Edit comment">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteComment('${
                  comment.id
                }', '${post.id}')" title="Delete comment">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            `
                    : ""
                }
              </div>
            </div>
          </div>
        </div>
      `
              )
              .join("")
          : '<p class="text-muted text-center">No comments yet</p>'
      }
    </div>
    <div class="comment-form">
      <div class="input-group">
        <input type="text" class="form-control form-control-sm" placeholder="Write a comment..." id="comment-input-${
          post.id
        }" onkeypress="handleCommentKeyPress(event, '${post.id}')">
        <button class="btn btn-primary btn-sm" onclick="submitComment('${
          post.id
        }')">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  </div>
</div>
`
    )
    .join("");

  postsList.innerHTML += postsHTML;
}

function updateLoadMoreButton() {
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const loadMoreContainer = document.getElementById("loadMoreContainer");
  const loadMoreSpinner = document.getElementById("loadMoreSpinner");

  if (loadMoreBtn && loadMoreContainer) {
    if (hasNextPage) {
      loadMoreContainer.classList.remove("d-none");
      loadMoreBtn.disabled = false;
      loadMoreSpinner.classList.add("d-none");
    } else {
      loadMoreContainer.classList.add("d-none");
    }
  }
}

function loadMorePosts() {
  if (!isLoading && hasNextPage) {
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    const loadMoreSpinner = document.getElementById("loadMoreSpinner");

    if (loadMoreBtn && loadMoreSpinner) {
      loadMoreBtn.disabled = true;
      loadMoreSpinner.classList.remove("d-none");
    }

    currentPage++;
    loadPosts(false)
      .then(() => {
        // Re-enable the button and hide spinner after loading
        if (loadMoreBtn && loadMoreSpinner) {
          loadMoreBtn.disabled = false;
          loadMoreSpinner.classList.add("d-none");
        }
      })
      .catch((error) => {
        console.error("Error loading more posts:", error);
        // Re-enable the button and hide spinner on error
        if (loadMoreBtn && loadMoreSpinner) {
          loadMoreBtn.disabled = false;
          loadMoreSpinner.classList.add("d-none");
        }
      });
  }
}

function updatePostsCount(count) {
  const postsCountElement = document.getElementById("postsCount");
  if (postsCountElement) {
    postsCountElement.textContent = `${count} post${count !== 1 ? "s" : ""}`;
  }
}

function showNoPostsMessage() {
  const noPosts = document.getElementById("noPosts");
  const postsList = document.getElementById("postsList");

  // Hide posts list and show no posts message
  postsList.classList.add("d-none");
  noPosts.classList.remove("d-none");

  // Check if user has any posts of their own
  checkUserPosts();
}

function checkUserPosts() {
  // First check if user has friends
  fetch("/friends/check-friends")
    .then((response) => response.json())
    .then((friendsData) => {
      // Then check user's own posts
      return fetch("/posts/my-posts")
        .then((response) => response.json())
        .then((postsData) => {
          return { friendsData, postsData };
        });
    })
    .then(({ friendsData, postsData }) => {
      const noPosts = document.getElementById("noPosts");
      const hasFriends = friendsData.hasFriends;
      const hasPosts = postsData.posts && postsData.posts.length > 0;

      if (hasFriends && !hasPosts) {
        // User has friends but no posts from anyone (including friends)
        noPosts.innerHTML = `
          <div class="py-5">
            <i class="fas fa-newspaper fa-3x text-muted mb-3"></i>
            <h5 class="text-muted">No posts yet</h5>
            <p class="text-muted">
              Your friends haven't posted anything yet.<br>
              Be the first to share something!
            </p>
            <div class="mt-3">
              <button class="btn btn-primary" onclick="openCreatePostModal()">
                <i class="fas fa-plus"></i> Create Post
              </button>
            </div>
          </div>
        `;
      } else if (!hasFriends && hasPosts) {
        // User has posts but no friends
        noPosts.innerHTML = `
          <div class="py-5">
            <i class="fas fa-users fa-3x text-muted mb-3"></i>
            <h5 class="text-muted">No posts to show</h5>
            <p class="text-muted">
              You don't have any friends yet, so you can only see your own posts.<br>
              Add some friends to see their posts in your feed!
            </p>
            <div class="mt-3">
              <button class="btn btn-primary me-2" onclick="openCreatePostModal()">
                <i class="fas fa-plus"></i> Create Post
              </button>
              <a href="/friends/users" class="btn btn-outline-primary">
                <i class="fas fa-user-plus"></i> Find Friends
              </a>
            </div>
          </div>
        `;
      } else if (!hasFriends && !hasPosts) {
        // User has no posts and no friends
        noPosts.innerHTML = `
          <div class="py-5">
            <i class="fas fa-rocket fa-3x text-muted mb-3"></i>
            <h5 class="text-muted">Welcome to your feed!</h5>
            <p class="text-muted">
              Start by creating your first post or finding some friends!
            </p>
            <div class="mt-3">
              <button class="btn btn-primary me-2" onclick="openCreatePostModal()">
                <i class="fas fa-plus"></i> Create Post
              </button>
              <a href="/friends/users" class="btn btn-outline-primary">
                <i class="fas fa-user-plus"></i> Find Friends
              </a>
            </div>
          </div>
        `;
      }
    })
    .catch((error) => {
      console.error("Error checking user status:", error);
      // Fallback to default message
      const noPosts = document.getElementById("noPosts");
      noPosts.innerHTML = `
        <div class="py-5">
          <i class="fas fa-users fa-3x text-muted mb-3"></i>
          <h5 class="text-muted">No posts to show</h5>
          <p class="text-muted">
            You don't have any friends yet, so you can only see your own posts.<br>
            Add some friends to see their posts in your feed!
          </p>
          <div class="mt-3">
            <button class="btn btn-primary me-2" onclick="openCreatePostModal()">
              <i class="fas fa-plus"></i> Create Post
            </button>
            <a href="/friends/users" class="btn btn-outline-primary">
              <i class="fas fa-user-plus"></i> Find Friends
            </a>
          </div>
        </div>
      `;
    });
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  } else if (diffInHours < 168) {
    // 7 days
    const days = Math.floor(diffInHours / 24);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  } else {
    return (
      date.toLocaleDateString() +
      " at " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }
}

async function deletePost(postId) {
  // Use custom confirmation modal instead of browser confirm
  const confirmed = await confirmDelete(
    "Are you sure you want to delete this post?"
  );

  if (confirmed) {
    fetch(`/posts/${postId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          loadPosts(); // Refresh posts list
          showNotification("Post deleted successfully", "success");
        } else {
          showNotification(data.error || "Failed to delete post", "danger");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showNotification("Failed to delete post. Please try again.", "danger");
      });
  }
}

function editPost(postId) {
  // Check if currentUserId is available
  if (!currentUserId) {
    showNotification(
      "User authentication error. Please refresh the page.",
      "danger"
    );
    return;
  }

  // Fetch the post data and open edit modal
  fetch(`/posts/${postId}`, {
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.post) {
        // Check if the post belongs to the current user
        if (data.post.user.id === currentUserId) {
          // Populate the edit modal
          document.getElementById("editPostId").value = postId;
          document.getElementById("editPostContent").value = data.post.content;
          document.getElementById("editCharCount").textContent =
            data.post.content.length;

          // Reset character count color
          const charCountElement = document.getElementById("editCharCount");
          if (data.post.content.length > 900) {
            charCountElement.style.color = "#dc3545";
          } else if (data.post.content.length > 800) {
            charCountElement.style.color = "#ffc107";
          } else {
            charCountElement.style.color = "#6c757d";
          }

          // Show the edit modal
          editPostModal.show();
        } else {
          showNotification("You can only edit your own posts.", "warning");
        }
      } else {
        showNotification("Post not found.", "warning");
      }
    })
    .catch((error) => {
      console.error("Error fetching post:", error);
      showNotification(
        "Failed to load post for editing. Please try again.",
        "danger"
      );
    });
}

function saveEditedPost() {
  const postId = document.getElementById("editPostId").value;
  const content = document.getElementById("editPostContent").value.trim();

  if (!content) {
    showNotification("Please enter some content for your post.", "warning");
    return;
  }

  if (content.length > 250) {
    showNotification("Post content cannot exceed 250 characters.", "warning");
    return;
  }

  const saveEditPostBtn = document.getElementById("saveEditPostBtn");
  const originalText = saveEditPostBtn.innerHTML;
  saveEditPostBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Saving...';
  saveEditPostBtn.disabled = true;

  fetch(`/posts/${postId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        editPostModal.hide();
        loadPosts(); // Refresh posts list
        showNotification("Post updated successfully!", "success");
      } else {
        showNotification(data.error || "Failed to update post", "danger");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showNotification("Failed to update post. Please try again.", "danger");
    })
    .finally(() => {
      saveEditPostBtn.innerHTML = originalText;
      saveEditPostBtn.disabled = false;
    });
}

function showUserSearch() {
  // Focus on the header search input
  const searchInput = document.getElementById("headerSearchInput");
  if (searchInput) {
    searchInput.focus();
    // Trigger search dropdown
    searchInput.dispatchEvent(new Event("input"));
  }
}

// Post Action Functions
function likePost(postId) {
  const likeButton = document.getElementById(`like-btn-${postId}`);
  const icon = likeButton.querySelector("i");

  fetch(`/posts/${postId}/like`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        if (data.liked) {
          // Like the post
          likeButton.classList.remove("btn-outline-primary");
          likeButton.classList.add("liked");
          // Keep the heart icon and add "Liked" text, then make it red
          likeButton.innerHTML =
            '<i class="fas fa-heart" style="color: red;"></i> Liked';

          // Update likes count
          const likesElement = document.getElementById(`likes-${postId}`);
          const currentLikes = parseInt(likesElement.textContent) || 0;
          likesElement.textContent = `${currentLikes + 1} like${
            currentLikes + 1 !== 1 ? "s" : ""
          }`;
        } else {
          // Unlike the post
          likeButton.classList.remove("liked");
          likeButton.classList.add("btn-outline-primary");
          icon.style.color = "";
          // Keep the heart icon and revert to "Like" text
          likeButton.innerHTML = '<i class="fas fa-heart"></i> Like';

          // Update likes count
          const likesElement = document.getElementById(`likes-${postId}`);
          const currentLikes = parseInt(likesElement.textContent) || 1;
          likesElement.textContent = `${currentLikes - 1} like${
            currentLikes - 1 !== 1 ? "s" : ""
          }`;
        }
      } else {
        alert(data.error || "Failed to toggle like");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Failed to toggle like. Please try again.");
    });
}

function toggleComments(postId) {
  const commentsSection = document.getElementById(`comments-section-${postId}`);

  if (commentsSection.classList.contains("d-none")) {
    commentsSection.classList.remove("d-none");
    // Focus on the comment input when opening
    const commentInput = document.getElementById(`comment-input-${postId}`);
    if (commentInput) {
      commentInput.focus();
    }
  } else {
    commentsSection.classList.add("d-none");
  }
}

function loadCommentsForPost(postId) {
  fetch(`/posts/${postId}/comments`)
    .then((response) => response.json())
    .then((data) => {
      const commentsList = document.getElementById(`comments-list-${postId}`);
      if (data.comments.length === 0) {
        commentsList.innerHTML =
          '<p class="text-muted text-center">No comments yet</p>';
      } else {
        commentsList.innerHTML = data.comments
          .map(
            (comment) => `
    <div class="comment-item p-2 border-bottom" data-comment-id="${comment.id}">
      <div class="d-flex align-items-start">
        <div class="user-avatar-small me-2" style="width: 24px; height: 24px; font-size: 0.7rem;">
          ${getUserAvatar(comment.user)}
        </div>
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <small class="fw-bold">
                <a href="/profile/${
                  comment.user.id
                }" class="text-decoration-none">
                  ${comment.user.firstName || ""} ${comment.user.lastName || ""}
                </a>
              </small>
              <div class="comment-content">${comment.content}</div>
              <small class="text-muted">${formatDateTime(
                comment.createdAt
              )}</small>
            </div>
            ${
              comment.user.id === currentUserId
                ? `
              <div class="btn-group btn-group-sm">
                <button class="btn btn-sm btn-outline-primary" onclick="editComment('${
                  comment.id
                }', '${postId}', '${comment.content.replace(
                    /'/g,
                    "\\'"
                  )}')" title="Edit comment">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteComment('${
                  comment.id
                }', '${postId}')" title="Delete comment">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            `
                : ""
            }
          </div>
        </div>
      </div>
    </div>
  `
          )
          .join("");
      }

      // Update comment count
      const commentsElement = document.getElementById(`comments-${postId}`);
      commentsElement.textContent = `${data.comments.length} comment${
        data.comments.length !== 1 ? "s" : ""
      }`;
    })
    .catch((error) => {
      console.error("Error loading comments:", error);
    });
}

function showLikesModal(postId) {
  fetch(`/posts/${postId}/likes`)
    .then((response) => response.json())
    .then((data) => {
      const likesList = document.getElementById("likesList");
      if (data.likes.length === 0) {
        likesList.innerHTML =
          '<p class="text-muted text-center">No likes yet</p>';
      } else {
        likesList.innerHTML = data.likes
          .map(
            (like) => `
    <div class="d-flex align-items-center mb-2">
      <div class="user-avatar-small me-2" style="width: 32px; height: 32px; font-size: 0.8rem;">
        ${getUserAvatar(like.user)}
      </div>
      <div class="flex-grow-1">
        <div class="fw-bold">
          <a href="/profile/${like.user.id}" class="text-decoration-none">
            ${like.user.firstName || ""} ${like.user.lastName || ""}
          </a>
        </div>
        <div class="text-muted small">
          <a href="/profile/${
            like.user.id
          }" class="text-decoration-none text-muted">@${like.user.username}</a>
        </div>
      </div>
    </div>
  `
          )
          .join("");
      }

      const likesModal = new bootstrap.Modal(
        document.getElementById("likesModal")
      );
      likesModal.show();
    })
    .catch((error) => {
      console.error("Error fetching likes:", error);
      alert("Failed to load likes");
    });
}

function addComment(event, postId) {
  event.preventDefault();
  const commentInput = document.querySelector(`[data-post-id="${postId}"]`);
  const comment = commentInput.value.trim();

  if (!comment) {
    showNotification("Please enter a comment.", "warning");
    return;
  }

  fetch(`/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: comment }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Clear input
        commentInput.value = "";

        // Refresh the comments list to show the new comment
        loadCommentsForPost(postId);

        showNotification("Comment added!", "success");
      } else {
        showNotification(data.error || "Failed to add comment", "danger");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showNotification("Failed to add comment. Please try again.", "danger");
    });
}

function submitComment(postId) {
  const commentInput = document.getElementById(`comment-input-${postId}`);
  const comment = commentInput.value.trim();

  if (!comment) {
    showNotification("Please enter a comment.", "warning");
    return;
  }

  fetch(`/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: comment }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Clear input
        commentInput.value = "";

        // Refresh the comments list to show the new comment
        loadCommentsForPost(postId);

        showNotification("Comment added!", "success");
      } else {
        showNotification(data.error || "Failed to add comment", "danger");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showNotification("Failed to add comment. Please try again.", "danger");
    });
}

async function deleteComment(commentId, postId) {
  const confirmed = await confirmDelete(
    "Are you sure you want to delete this comment?"
  );
  if (confirmed) {
    fetch(`/posts/comments/${commentId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.success) {
          // Remove the comment from the DOM immediately
          const commentElement = document.querySelector(
            `[data-comment-id="${commentId}"]`
          );
          if (commentElement) {
            commentElement.remove();
          }

          // Update comment count
          const commentCountElement = document.getElementById(
            `comments-${postId}`
          );
          if (commentCountElement) {
            try {
              const currentCount =
                parseInt(commentCountElement.textContent.match(/\d+/)[0]) || 0;
              const newCount = Math.max(0, currentCount - 1);
              commentCountElement.textContent = `${newCount} comment${
                newCount !== 1 ? "s" : ""
              }`;
            } catch (e) {
              console.log(
                "Could not parse comment count, will refresh instead"
              );
            }
          }

          // Also refresh the comments list to ensure consistency
          loadCommentsForPost(postId);

          showNotification("Comment deleted!", "success");
        } else {
          showNotification(data.error || "Failed to delete comment", "danger");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showNotification(
          "Failed to delete comment. Please try again.",
          "danger"
        );
      });
  }
}

function editComment(commentId, postId, currentContent) {
  const editCommentModal = new bootstrap.Modal(
    document.getElementById("editCommentModal")
  );
  document.getElementById("editCommentId").value = commentId;
  document.getElementById("editCommentContent").value = currentContent;
  document.getElementById("editCommentCharCount").textContent =
    currentContent.length;

  // Store postId for use in saveEditedComment
  document.getElementById("editCommentId").setAttribute("data-post-id", postId);

  // Reset character count color
  const charCountElement = document.getElementById("editCommentCharCount");
  if (currentContent.length > 200) {
    charCountElement.style.color = "#dc3545";
  } else if (currentContent.length > 150) {
    charCountElement.style.color = "#ffc107";
  } else {
    charCountElement.style.color = "#6c757d";
  }

  editCommentModal.show();
}

function saveEditedComment() {
  const commentId = document.getElementById("editCommentId").value;
  const postId = document
    .getElementById("editCommentId")
    .getAttribute("data-post-id");
  const content = document.getElementById("editCommentContent").value.trim();

  if (!content) {
    showNotification("Please enter some content for your comment.", "warning");
    return;
  }

  if (content.length > 250) {
    showNotification(
      "Comment content cannot exceed 250 characters.",
      "warning"
    );
    return;
  }

  const saveEditCommentBtn = document.getElementById("saveEditCommentBtn");
  const originalText = saveEditCommentBtn.innerHTML;
  saveEditCommentBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i> Saving...';
  saveEditCommentBtn.disabled = true;

  fetch(`/posts/comments/${commentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        const editCommentModal = bootstrap.Modal.getInstance(
          document.getElementById("editCommentModal")
        );
        editCommentModal.hide();

        // Refresh the comments list to show the updated comment
        loadCommentsForPost(postId);

        // Show success notification
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-success alert-dismissible fade show position-fixed";
        alertDiv.style.cssText =
          "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
        alertDiv.innerHTML = `
  <i class="fas fa-check"></i> Comment updated successfully!
  <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
`;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 3000);
      } else {
        showNotification(data.error || "Failed to update comment", "danger");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showNotification("Failed to update comment. Please try again.", "danger");
    })
    .finally(() => {
      saveEditCommentBtn.innerHTML = originalText;
      saveEditCommentBtn.disabled = false;
    });
}

function sharePost(postId) {
  // Create share options
  const shareOptions = [
    {
      name: "Copy Link",
      icon: "fa-link",
      action: () => copyPostLink(postId),
    },
    {
      name: "Share on Facebook",
      icon: "fa-facebook",
      action: () => shareOnSocial("facebook", postId),
    },
    {
      name: "Share on Twitter",
      icon: "fa-twitter",
      action: () => shareOnSocial("twitter", postId),
    },
  ];

  const shareMenu = document.createElement("div");
  shareMenu.className =
    "share-menu position-absolute bg-white border rounded shadow p-2";
  shareMenu.style.cssText = "z-index: 1000; min-width: 200px;";

  shareMenu.innerHTML = shareOptions
    .map(
      (option) => `
<button class="btn btn-sm btn-outline-secondary w-100 mb-1" onclick="${option.action.toString()}()">
<i class="fas ${option.icon}"></i> ${option.name}
</button>
`
    )
    .join("");

  // Position the menu near the share button
  const shareButton = event.target.closest("button");
  const rect = shareButton.getBoundingClientRect();
  shareMenu.style.top = `${rect.bottom + 5}px`;
  shareMenu.style.left = `${rect.left}px`;

  document.body.appendChild(shareMenu);

  // Close menu when clicking outside
  setTimeout(() => {
    document.addEventListener("click", function closeMenu(e) {
      if (!shareMenu.contains(e.target) && !shareButton.contains(e.target)) {
        shareMenu.remove();
        document.removeEventListener("click", closeMenu);
      }
    });
  }, 100);
}

function copyPostLink(postId) {
  const postUrl = `${window.location.origin}/posts/${postId}`;
  navigator.clipboard.writeText(postUrl).then(() => {
    showNotification("Post link copied to clipboard!", "success");
  });
}

function shareOnSocial(platform, postId) {
  const postUrl = `${window.location.origin}/posts/${postId}`;
  const text = "Check out this post on OdinBook!";

  let shareUrl = "";
  switch (platform) {
    case "facebook":
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        postUrl
      )}`;
      break;
    case "twitter":
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text
      )}&url=${encodeURIComponent(postUrl)}`;
      break;
  }

  if (shareUrl) {
    window.open(shareUrl, "_blank", "width=600,height=400");
    showNotification(`Shared on ${platform}!`, "success");
  }
}

function handleCommentKeyPress(event, postId) {
  if (event.key === "Enter") {
    event.preventDefault();
    submitComment(postId);
  }
}

function confirmDelete(message) {
  return new Promise((resolve) => {
    const modalHTML = `
      <div class="modal fade" id="confirmDeleteModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Confirm Delete</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>${message}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById("confirmDeleteModal");
    if (existingModal) {
      existingModal.remove();
    }

    // Add modal to page
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Show modal
    const confirmModal = new bootstrap.Modal(
      document.getElementById("confirmDeleteModal")
    );
    confirmModal.show();

    // Handle confirm button click
    document
      .getElementById("confirmDeleteBtn")
      .addEventListener("click", () => {
        confirmModal.hide();
        resolve(true);
      });

    // Handle modal close
    document
      .getElementById("confirmDeleteModal")
      .addEventListener("hidden.bs.modal", () => {
        resolve(false);
      });
  });
}

function showNotification(message, type = "info") {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
  alertDiv.style.cssText =
    "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
  alertDiv.innerHTML = `
<i class="fas fa-${type === "success" ? "check" : "info"}"></i> ${message}
<button type="button" class="btn-close" data-bs-dismiss="alert"></button>
`;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3000);
}

// Photo handling functions
function handlePhotoSelection() {
  const fileInput = document.getElementById("postPhoto");
  const fileName = document.getElementById("photoFileName");
  const removeBtn = document.getElementById("removePhotoBtn");

  if (fileInput) {
    fileInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          showNotification("Photo size must be less than 10MB", "warning");
          this.value = "";
          return;
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
          showNotification("Please select an image file", "warning");
          this.value = "";
          return;
        }

        fileName.textContent = file.name;
        removeBtn.style.display = "inline-block";
      }
    });
  }
}

function removePhoto() {
  const fileInput = document.getElementById("postPhoto");
  const fileName = document.getElementById("photoFileName");
  const removeBtn = document.getElementById("removePhotoBtn");

  if (fileInput) {
    fileInput.value = "";
    fileName.textContent = "";
    removeBtn.style.display = "none";
  }
}

// Photo modal function
function openPhotoModal(photoUrl) {
  // Create modal HTML
  const modalHTML = `
    <div class="modal fade" id="photoModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Photo</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center">
            <img src="${photoUrl}" alt="Post photo" class="img-fluid" style="max-width: 100%;">
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal if any
  const existingModal = document.getElementById("photoModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Add modal to page
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Show modal
  const photoModal = new bootstrap.Modal(document.getElementById("photoModal"));
  photoModal.show();

  // Clean up modal when hidden
  document
    .getElementById("photoModal")
    .addEventListener("hidden.bs.modal", function () {
      this.remove();
    });
}

// Function to refresh friends list on dashboard
function refreshFriendsList() {
  console.log("[DASHBOARD] Refreshing friends list...");

  // If we're on the dashboard, refresh posts to show/hide friend posts
  if (typeof loadPosts === "function") {
    loadPosts(true);
  }

  // Update friend request count in header
  if (typeof updateHeaderRequestCount === "function") {
    updateHeaderRequestCount();
  }
}
