// Extracted from views/profile/index.ejs (profile logic)

// Initialize modals
let createPostModal;
let editPostModal;
let likesModal;
let editProfileModal;
let viewAllFriendsModal;

// Get current user ID from the page
const currentUserId = document
  .querySelector('meta[name="user-id"]')
  ?.getAttribute("content");

// Debug: Log the current user ID
console.log("[PROFILE] Current user ID:", currentUserId);

// Safety check: If currentUserId is not available, try to get it from the profile page data
if (!currentUserId) {
  const profileUserElement = document.querySelector("[data-profile-user-id]");
  if (profileUserElement) {
    const profileUserId = profileUserElement.getAttribute(
      "data-profile-user-id"
    );
    console.log("[PROFILE] Using profile user ID as fallback:", profileUserId);
  }
}

// Global variables for pagination
let currentPage = 1;
let hasNextPage = true;
let isLoading = false;

// Helper function to update character counter colors
function updateCharCounterColor(
  element,
  charCount,
  dangerLimit = 900,
  warningLimit = 800
) {
  element.classList.remove(
    "char-counter-danger",
    "char-counter-warning",
    "char-counter-normal"
  );
  if (charCount > dangerLimit) {
    element.classList.add("char-counter-danger");
  } else if (charCount > warningLimit) {
    element.classList.add("char-counter-warning");
  } else {
    element.classList.add("char-counter-normal");
  }
}

// Function to send friend request from profile page
function sendFriendRequest(userId, userName = "") {
  console.log(
    `[PROFILE] sendFriendRequest called for user ${userId} (${userName})`
  );

  // Find the button that was clicked and update it immediately
  const addFriendBtn = document.querySelector(
    `button[onclick*="sendFriendRequest('${userId}")`
  );
  if (addFriendBtn) {
    // Update button to show "Request Sent" state
    addFriendBtn.className = "btn btn-secondary btn-lg";
    addFriendBtn.disabled = true;
    addFriendBtn.innerHTML = '<i class="fas fa-clock me-2"></i> Request Sent';
    addFriendBtn.onclick = null; // Remove onclick handler
  }

  fetch("/friends/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ receiverId: userId }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        // Show success notification
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-success alert-dismissible fade show position-fixed";
        alertDiv.innerHTML = `
                <div><i class="fas fa-user-plus"></i> Friend request sent to ${
                  userName || "user"
                }!</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
              `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 3000);

        // Reload the page to update the UI
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        // Reset button to original state on error
        if (addFriendBtn) {
          addFriendBtn.className = "btn btn-primary btn-lg";
          addFriendBtn.disabled = false;
          addFriendBtn.innerHTML =
            '<i class="fas fa-user-plus me-2"></i> Add Friend';
          addFriendBtn.onclick = `sendFriendRequest('${userId}', '${userName}')`;
        }

        // Show error notification
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-danger alert-dismissible fade show position-fixed";
        alertDiv.innerHTML = `
                <div><i class="fas fa-exclamation-triangle"></i> ${
                  data.error || "Could not send request"
                }</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
              `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
      }
    })
    .catch((error) => {
      console.error("Error sending friend request:", error);

      // Reset button to original state on error
      if (addFriendBtn) {
        addFriendBtn.className = "btn btn-primary btn-lg";
        addFriendBtn.disabled = false;
        addFriendBtn.innerHTML =
          '<i class="fas fa-user-plus me-2"></i> Add Friend';
        addFriendBtn.onclick = `sendFriendRequest('${userId}', '${userName}')`;
      }

      // Show error notification
      const alertDiv = document.createElement("div");
      alertDiv.className =
        "alert alert-danger alert-dismissible fade show position-fixed";
      alertDiv.innerHTML = `
              <div><i class="fas fa-exclamation-triangle"></i> Could not send request. Please try again.</div>
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
      document.body.appendChild(alertDiv);
      setTimeout(() => alertDiv.remove(), 5000);
    });
}

// Function to get user avatar (Gravatar or initials)
function getUserAvatar(user) {
  console.log("getUserAvatar called with user:", user);

  if (
    user.profilePicture &&
    (user.profilePicture.startsWith("http") ||
      user.profilePicture.startsWith("/uploads/") ||
      user.profilePicture.includes("cloudinary.com"))
  ) {
    console.log("Using profile picture:", user.profilePicture);
    return `<img src="${user.profilePicture}" alt="Profile Picture" class="profile-image avatar-cover" />`;
  } else if (user.useGravatar && user.email && user.gravatarUrl) {
    console.log("Using Gravatar:", user.gravatarUrl);
    return `<img src="${user.gravatarUrl}" alt="Profile Picture" class="profile-image avatar-cover" />`;
  } else {
    console.log("Using initials fallback");
    return `<div class="text-white rounded-circle d-flex align-items-center justify-content-center avatar-initials">${(
      user.firstName || ""
    ).charAt(0)}${(user.lastName || "").charAt(0)}</div>`;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  createPostModal = new bootstrap.Modal(
    document.getElementById("createPostModal")
  );
  editPostModal = new bootstrap.Modal(document.getElementById("editPostModal"));
  likesModal = new bootstrap.Modal(document.getElementById("likesModal"));
  editProfileModal = new bootstrap.Modal(
    document.getElementById("editProfileModal")
  );
  viewAllFriendsModal = new bootstrap.Modal(
    document.getElementById("viewAllFriendsModal")
  );

  // Prevent scrollbar from disappearing when edit profile modal opens
  document
    .getElementById("editProfileModal")
    .addEventListener("show.bs.modal", function () {
      // Store current scrollbar width to prevent layout shift
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = scrollbarWidth + "px";
      document.body.style.overflow = "scroll";
    });

  document
    .getElementById("editProfileModal")
    .addEventListener("hidden.bs.modal", function () {
      // Restore original body styles
      document.body.style.paddingRight = "";
      document.body.style.overflow = "";
    });

  // Add validation event listeners for edit profile modal
  document
    .getElementById("editProfileModal")
    .addEventListener("show.bs.modal", function () {
      // Store current username for comparison
      const currentUsername = document.getElementById("editUsername").value;

      // Add event listener for username input
      const usernameInput = document.getElementById("editUsername");
      usernameInput.addEventListener("input", function () {
        const username = this.value.trim();
        validateEditUsername(username, currentUsername);
      });

      // Add event listener for birthday input
      const birthdayInput = document.getElementById("editBirthday");
      birthdayInput.addEventListener("change", function () {
        const birthday = this.value;
        validateEditBirthday(birthday);
      });
    });

  // Initialize photo handling
  initializePhotoHandling();

  // Make sendFriendRequest function globally available
  window.sendFriendRequest = sendFriendRequest;

  // Make cancelFriendRequest function globally available
  window.cancelFriendRequest = cancelFriendRequest;

  // Add event listeners for remove friend buttons in the modal
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("remove-friend-btn")) {
      e.preventDefault();
      const friendId = e.target.dataset.friendId;
      const friendName = e.target.dataset.friendName;
      removeFriend(friendId, friendName);
    }
  });

  // Character count for create post modal
  const postContent = document.getElementById("postContent");
  if (postContent) {
    postContent.addEventListener("input", function () {
      const charCount = this.value.length;
      document.getElementById("charCount").textContent = charCount;
      document.getElementById("charCount").style.color =
        charCount > 200 ? "#dc3545" : charCount > 150 ? "#ffc107" : "#6c757d";
    });
  }

  // Character count for edit post modal
  const editPostContent = document.getElementById("editPostContent");
  if (editPostContent) {
    editPostContent.addEventListener("input", function () {
      const charCount = this.value.length;
      document.getElementById("editCharCount").textContent = charCount;
      document.getElementById("editCharCount").style.color =
        charCount > 250 ? "#dc3545" : charCount > 200 ? "#ffc107" : "#6c757d";
    });
  }

  // Character count for inline post form
  const inlinePostContent = document.getElementById("inlinePostContent");
  if (inlinePostContent) {
    inlinePostContent.addEventListener("input", function () {
      const charCount = this.value.length;
      document.getElementById("inlineCharCount").textContent = charCount;
      document.getElementById("inlineCharCount").style.color =
        charCount > 200 ? "#dc3545" : charCount > 150 ? "#ffc107" : "#6c757d";
    });
  }

  // Character count for bio textarea
  const bioTextarea = document.getElementById("bioTextarea");
  if (bioTextarea) {
    bioTextarea.addEventListener("input", function () {
      const charCount = this.value.length;
      document.getElementById("bioCharCount").textContent = charCount;
      document.getElementById("bioCharCount").style.color =
        charCount > 400 ? "#dc3545" : charCount > 300 ? "#ffc107" : "#6c757d";
    });
  }

  // Character count for edit comment textarea
  const editCommentContent = document.getElementById("editCommentContent");
  if (editCommentContent) {
    editCommentContent.addEventListener("input", function () {
      const charCount = this.value.length;
      document.getElementById("editCommentCharCount").textContent = charCount;
      document.getElementById("editCommentCharCount").style.color =
        charCount > 200 ? "#dc3545" : charCount > 150 ? "#ffc107" : "#6c757d";
    });
  }

  // Add event listeners for remove friend buttons
  document.querySelectorAll(".remove-friend-btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const friendId = this.dataset.friendId;
      const friendName = this.dataset.friendName;
      removeFriend(friendId, friendName);
    });
  });

  // Add event listener for profile picture upload
  const profilePictureInput = document.getElementById("profilePictureInput");
  if (profilePictureInput) {
    profilePictureInput.addEventListener("change", handleProfilePictureUpload);
  }
});

function openCreatePostModal() {
  document.getElementById("postContent").value = "";
  document.getElementById("charCount").textContent = "0";
  document.getElementById("charCount").style.color = "#6c757d";
  createPostModal.show();
}

function createPost() {
  const content = document.getElementById("postContent").value.trim();

  // Require either content (min 1 char) OR an image
  if (!content) {
    showNotification("Please enter some content for your post.", "warning");
    return;
  }

  if (content.length > 250) {
    showNotification("Post content cannot exceed 250 characters.", "warning");
    return;
  }

  const createBtn = document.getElementById("createPostBtn");
  const originalText = createBtn.innerHTML;
  createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
  createBtn.disabled = true;

  console.log(`[PROFILE] Creating post with content:`, content);
  console.log(`[PROFILE] Current user ID:`, currentUserId);
  console.log(`[PROFILE] Profile user ID:`, profileUserId);

  fetch("/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin", // Include cookies/session
    body: JSON.stringify({ content }),
  })
    .then((response) => {
      console.log(`[PROFILE] Post creation response status:`, response.status);
      console.log(
        `[PROFILE] Post creation response headers:`,
        response.headers
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Log the raw response text to see what we're actually getting
      return response.text().then((text) => {
        console.log(`[PROFILE] Raw response text:`, text);
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error(`[PROFILE] JSON parse error:`, e);
          console.error(`[PROFILE] Response was not valid JSON:`, text);
          throw new Error(
            `Server returned invalid JSON: ${text.substring(0, 100)}...`
          );
        }
      });
    })
    .then((data) => {
      if (data.success) {
        createPostModal.hide();

        // Clear the form
        document.getElementById("postContent").value = "";
        document.getElementById("charCount").textContent = "0";
        document.getElementById("charCount").style.color = "#6c757d";

        // Show success notification
        showNotification("Post created successfully!", "success");

        // Soft refresh the posts feed to show the new post
        loadPosts(true);
      } else {
        showNotification(data.error || "Failed to create post", "danger");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showNotification("Failed to create post. Please try again.", "danger");
    })
    .finally(() => {
      createBtn.innerHTML = originalText;
      createBtn.disabled = false;
    });
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
          updateCharCounterColor(
            charCountElement,
            data.post.content.length,
            250,
            200
          );

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
  const content = document.getElementById("editPostContent").value.trim();

  console.log(
    "Saving edited post with content:",
    `"${content}"`,
    "Length:",
    content.length
  );

  // Allow empty content - no minimum character requirement
  if (content.length > 250) {
    showNotification("Post content cannot exceed 250 characters.", "warning");
    return;
  }

  const postId = document.getElementById("editPostId").value;
  const saveBtn = document.getElementById("saveEditPostBtn");
  const originalText = saveBtn.innerHTML;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  saveBtn.disabled = true;

  fetch(`/posts/${postId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        editPostModal.hide();

        // Update the post content in the DOM instead of reloading
        const postId = document.getElementById("editPostId").value;
        const postElement = document.querySelector(
          `[data-post-id="${postId}"]`
        );
        if (postElement) {
          const postContentElement =
            postElement.querySelector(".post-content p");
          if (postContentElement) {
            postContentElement.textContent = content;
          }
        }

        showNotification("Post updated successfully", "success");
      } else {
        showNotification(data.error || "Failed to update post", "danger");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showNotification("Failed to update post. Please try again.", "danger");
    })
    .finally(() => {
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = false;
    });
}

async function deletePost(postId) {
  // Use custom confirmation modal instead of browser confirm
  const confirmed = await confirmDelete(
    "Are you sure you want to delete this post?"
  );

  if (confirmed) {
    fetch(`/posts/${postId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Remove the post from the DOM instead of reloading
          const postElement = document.querySelector(
            `[data-post-id="${postId}"]`
          );
          if (postElement) {
            postElement.remove();
          }
          // Refresh posts to update pagination
          loadPosts(true);
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

function toggleLike(postId) {
  const likeButton = document.getElementById(`like-btn-${postId}`);
  const icon = likeButton.querySelector("i");

  fetch(`/posts/${postId}/like`, {
    method: "POST",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        if (data.liked) {
          // Like the post
          likeButton.classList.remove("btn-outline-primary");
          likeButton.classList.add("liked");
          icon.style.color = "#dc2626";

          // Update the like count in the button
          const likeCount = likeButton.querySelector(".like-count");
          if (likeCount) {
            const currentCount = parseInt(likeCount.textContent) || 0;
            likeCount.textContent = currentCount + 1;
          }

          // Update hidden likes count for modal
          const likesElement = document.getElementById(`likes-${postId}`);
          if (likesElement) {
            const currentLikes = parseInt(likesElement.textContent) || 0;
            likesElement.textContent = `${currentLikes + 1} like${
              currentLikes + 1 !== 1 ? "s" : ""
            }`;
          }
        } else {
          // Unlike the post
          likeButton.classList.remove("liked");
          likeButton.classList.add("btn-outline-primary");
          icon.style.color = "white";

          // Update the like count in the button
          const likeCount = likeButton.querySelector(".like-count");
          if (likeCount) {
            const currentCount = parseInt(likeCount.textContent) || 1;
            likeCount.textContent = currentCount - 1;
          }

          // Update hidden likes count for modal
          const likesElement = document.getElementById(`likes-${postId}`);
          if (likesElement) {
            const currentLikes = parseInt(likesElement.textContent) || 1;
            likesElement.textContent = `${currentLikes - 1} like${
              currentLikes - 1 !== 1 ? "s" : ""
            }`;
          }
        }
      } else {
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-danger alert-dismissible fade show position-fixed";
        alertDiv.innerHTML = `
              <div><i class="fas fa-exclamation-triangle"></i> ${
                data.error || "Failed to toggle like"
              }</div>
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      const alertDiv = document.createElement("div");
      alertDiv.className =
        "alert alert-danger alert-dismissible fade show position-fixed";
      alertDiv.innerHTML = `
            <div><i class="fas fa-exclamation-triangle"></i> Failed to toggle like. Please try again.</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          `;
      document.body.appendChild(alertDiv);
      setTimeout(() => alertDiv.remove(), 5000);
    });
}

function toggleComments(postId) {
  console.log(`[PROFILE] toggleComments called for post ${postId}`);
  const commentsSection = document.getElementById(`comments-section-${postId}`);
  console.log(`[PROFILE] Comments section found:`, commentsSection);

  if (commentsSection.classList.contains("d-none")) {
    console.log(`[PROFILE] Showing comments section`);
    commentsSection.classList.remove("d-none");
    // Focus on the comment input when opening
    const commentInput = document.getElementById(`comment-input-${postId}`);
    if (commentInput) {
      commentInput.focus();
    }
  } else {
    console.log(`[PROFILE] Hiding comments section`);
    commentsSection.classList.add("d-none");
  }
}

// Function to format date/time - copied from dashboard
function formatDateTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Function to load posts from backend - copied from dashboard
function loadPosts(reset = true) {
  console.log(`[PROFILE] loadPosts called with reset: ${reset}`);

  if (isLoading) {
    console.log("[PROFILE] Already loading posts, skipping...");
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

  // Get the profile user ID from the page
  let profileUserId = currentUserId; // Default to current user
  const profileUserElement = document.querySelector("[data-profile-user-id]");
  if (profileUserElement) {
    profileUserId = profileUserElement.getAttribute("data-profile-user-id");
  }

  // Check if we're viewing our own profile or if we're friends with the profile user
  const isOwnProfile = profileUserId === currentUserId;
  const isFriend =
    document
      .querySelector("[data-is-friend]")
      ?.getAttribute("data-is-friend") === "true";

  // If not our own profile and not friends, don't try to load posts
  if (!isOwnProfile && !isFriend) {
    console.log(
      `[PROFILE] Not friends with user ${profileUserId}, skipping posts load`
    );
    postsLoading.classList.add("d-none");
    isLoading = false;
    showNoPostsMessage();
    return Promise.resolve();
  }

  console.log(
    `[PROFILE] Loading posts for user ${profileUserId}, page: ${currentPage}, reset: ${reset}, isOwnProfile: ${isOwnProfile}, isFriend: ${isFriend}`
  );

  return fetch(
    `/profile/${profileUserId}/posts?page=${currentPage}&limit=10&_t=${Date.now()}`,
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

      console.log(`[PROFILE] Posts API response:`, data);

      if (data.posts && data.posts.length > 0) {
        console.log(`[PROFILE] Displaying ${data.posts.length} posts`);
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
        console.log(`[PROFILE] No posts found, showing no posts message`);
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

// Function to refresh posts (force reload)
function refreshPosts() {
  console.log("[PROFILE] Refreshing posts...");

  // Clear any cached data
  currentPage = 1;
  hasNextPage = true;

  // Force reload posts
  loadPosts(true);

  // Show feedback to user
  showNotification("Posts refreshed!", "success");
}

// Function to load more posts
function loadMorePosts() {
  if (isLoading || !hasNextPage) return;

  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const loadMoreSpinner = document.getElementById("loadMoreSpinner");

  loadMoreBtn.disabled = true;
  loadMoreSpinner.classList.remove("d-none");

  currentPage++;
  loadPosts(false).finally(() => {
    loadMoreBtn.disabled = false;
    loadMoreSpinner.classList.add("d-none");
  });
}

// Function to update load more button
function updateLoadMoreButton() {
  const loadMoreContainer = document.getElementById("loadMoreContainer");
  if (hasNextPage) {
    loadMoreContainer.classList.remove("d-none");
  } else {
    loadMoreContainer.classList.add("d-none");
  }
}

// Function to show no posts message
function showNoPostsMessage() {
  const postsList = document.getElementById("postsList");
  const noPosts = document.getElementById("noPosts");

  postsList.classList.add("d-none");
  noPosts.classList.remove("d-none");
}

// Function to show notification
function showNotification(message, type = "info") {
  // Simple notification - you can enhance this with a proper notification library
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// Function to display posts - copied from dashboard
function displayPosts(posts) {
  const postsList = document.getElementById("postsList");
  const noPosts = document.getElementById("noPosts");

  console.log(`[PROFILE] displayPosts called with ${posts.length} posts`);

  if (posts.length === 0) {
    console.log(`[PROFILE] No posts to display, showing no posts message`);
    postsList.classList.add("d-none");
    noPosts.classList.remove("d-none");
    return;
  }

  console.log(`[PROFILE] Displaying posts, hiding no posts message`);
  console.log(`[PROFILE] Posts data:`, posts);

  // Debug: Log the first post's likes structure
  if (posts.length > 0) {
    console.log(`[PROFILE] First post likes:`, posts[0].likes);
    console.log(`[PROFILE] First post likes type:`, typeof posts[0].likes);
    console.log(
      `[PROFILE] First post likes length:`,
      posts[0].likes ? posts[0].likes.length : "undefined"
    );
  }

  noPosts.classList.add("d-none");
  postsList.classList.remove("d-none");

  postsList.innerHTML = posts
    .map(
      (post) => `
<div class="post-item mb-4 p-3 border rounded" data-post-id="${post.id}">
  <div class="d-flex align-items-start mb-3">
    <div class="user-avatar-small me-3 avatar-medium">
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
                <button class="dropdown-item" role="menuitem" onclick="editPost('${post.id}')">
                  <i class="fas fa-edit me-2"></i>Edit
                </button>
              </li>
              <li role="none">
                <button class="dropdown-item text-danger" role="menuitem" onclick="deletePost('${post.id}')">
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
  <div class="post-actions ${
    post.content || post.photoUrl ? "mt-1 pt-1" : "mt-1 pt-1"
  } border-top">
    <div class="d-flex justify-content-between align-items-center">
      <!-- Action Buttons -->
      <div class="d-flex gap-2">
        <button class="btn btn-sm ${
          post.likes &&
          post.likes.some((like) => like.user.id === currentUserId)
            ? "liked"
            : "btn-outline-primary"
        } like-btn post-action-btn" id="like-btn-${
        post.id
      }" onclick="likePost('${post.id}')" data-post-id="${post.id}" title="${
        post.likes && post.likes.some((like) => like.user.id === currentUserId)
          ? "Unlike"
          : "Like"
      }">
          <i class="fas fa-heart" style="color: ${
            post.likes &&
            post.likes.some((like) => like.user.id === currentUserId)
              ? "red"
              : "inherit"
          };"></i>
          <span class="like-count">${
            (post.likes && Array.isArray(post.likes) && post.likes.length) || 0
          }</span>
        </button>
        <button class="btn btn-sm btn-outline-secondary post-action-btn" onclick="toggleComments('${
          post.id
        }')" title="Comment">
          <i class="fas fa-comment"></i>
          <span class="comment-count">${
            (post.comments &&
              Array.isArray(post.comments) &&
              post.comments.length) ||
            0
          }</span>
        </button>
      </div>
      <!-- Counters - Hidden since they are in buttons -->
      <div class="text-muted small d-none">
        <span class="likes-count cursor-pointer" id="likes-${
          post.id
        }" onclick="showLikesModal('${post.id}')">${
        (post.likes && Array.isArray(post.likes) && post.likes.length) || 0
      } like${
        ((post.likes && Array.isArray(post.likes) && post.likes.length) ||
          0) !== 1
          ? "s"
          : ""
      }</span>
        <span class="comments-count ms-2 cursor-pointer" id="comments-${
          post.id
        }" onclick="toggleComments('${post.id}')">${
        (post.comments &&
          Array.isArray(post.comments) &&
          post.comments.length) ||
        0
      } comment${
        ((post.comments &&
          Array.isArray(post.comments) &&
          post.comments.length) ||
          0) !== 1
          ? "s"
          : ""
      }</span>
      </div>
    </div>
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
            <div class="user-avatar-small me-2">
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

// Function to append posts - copied from dashboard
function appendPosts(posts) {
  console.log(`[PROFILE] appendPosts called with:`, posts);
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
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
              <i class="fas fa-ellipsis-h"></i>
            </button>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="#" onclick="editPost('${post.id}')">
              Edit
              </a></li>
              <li><a class="dropdown-item text-danger" href="#" onclick="deletePost('${post.id}')">
                Delete
              </a></li>
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
  <div class="post-actions ${
    post.content || post.photoUrl ? "mt-1 pt-1" : "mt-1 pt-1"
  } border-top">
    <div class="d-flex justify-content-between align-items-center">
      <!-- Action Buttons -->
      <div class="d-flex gap-2">
        <button class="btn btn-sm ${
          post.likes.some((like) => like.user.id === currentUserId)
            ? "liked"
            : "btn-outline-primary"
        } like-btn post-action-btn" id="like-btn-${
        post.id
      }" onclick="likePost('${post.id}')" data-post-id="${post.id}" title="${
        post.likes && post.likes.some((like) => like.user.id === currentUserId)
          ? "Unlike"
          : "Like"
      }">
          <i class="fas fa-heart" style="color: ${
            post.likes &&
            post.likes.some((like) => like.user.id === currentUserId)
              ? "red"
              : "inherit"
          };"></i>
          <span class="like-count">${
            (post.likes && Array.isArray(post.likes) && post.likes.length) || 0
          }</span>
        </button>
        <button class="btn btn-sm btn-outline-secondary post-action-btn" onclick="toggleComments('${
          post.id
        }')" title="Comment">
          <i class="fas fa-comment"></i>
          <span class="comment-count">${
            (post.comments &&
              Array.isArray(post.comments) &&
              post.comments.length) ||
            0
          }</span>
        </button>
      </div>
      <!-- Counters - Hidden since they are in buttons -->
      <div class="text-muted small d-none">
        <span class="likes-count" id="likes-${
          post.id
        }" onclick="showLikesModal('${post.id}')" style="cursor: pointer;">${
        (post.likes && Array.isArray(post.likes) && post.likes.length) || 0
      } like${
        ((post.likes && Array.isArray(post.likes) && post.likes.length) ||
          0) !== 1
          ? "s"
          : ""
      }</span>
        <span class="comments-count ms-2" id="comments-${
          post.id
        }" onclick="toggleComments('${post.id}')" style="cursor: pointer;">${
        (post.comments &&
          Array.isArray(post.comments) &&
          post.comments.length) ||
        0
      } comment${
        ((post.comments &&
          Array.isArray(post.comments) &&
          post.comments.length) ||
          0) !== 1
          ? "s"
          : ""
      }</span>
      </div>
    </div>
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
            <div class="user-avatar-small me-2">
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

  postsList.insertAdjacentHTML("beforeend", postsHTML);
}

// Function to append posts (for pagination) - copied from dashboard
function appendPosts(posts) {
  const postsList = document.getElementById("postsList");

  const postsHTML = posts
    .map(
      (post) => `
<div class="post-item mb-4 p-3 border rounded" data-post-id="${post.id}">
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
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
              <i class="fas fa-ellipsis-h"></i>
            </button>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="#" onclick="editPost('${post.id}')">
              Edit
              </a></li>
              <li><a class="dropdown-item text-danger" href="#" onclick="deletePost('${post.id}')">
                Delete
              </a></li>
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
  <div class="post-actions ${
    post.content || post.photoUrl ? "mt-1 pt-1" : "mt-1 pt-1"
  } border-top">
    <div class="d-flex justify-content-between align-items-center">
      <!-- Action Buttons -->
      <div class="d-flex gap-2">
        <button class="btn btn-sm ${
          post.likes &&
          post.likes.some((like) => like.user.id === currentUserId)
            ? "liked"
            : "btn-outline-primary"
        } like-btn post-action-btn" id="like-btn-${
        post.id
      }" onclick="likePost('${post.id}')" data-post-id="${post.id}" title="${
        post.likes && post.likes.some((like) => like.user.id === currentUserId)
          ? "Unlike"
          : "Like"
      }">
          <i class="fas fa-heart" style="color: ${
            post.likes &&
            post.likes.some((like) => like.user.id === currentUserId)
              ? "red"
              : ""
          };"></i>
          <span class="like-count">${
            (post.likes && Array.isArray(post.likes) && post.likes.length) || 0
          }</span>
        </button>
        <button class="btn btn-sm btn-outline-secondary post-action-btn" onclick="toggleComments('${
          post.id
        }')" title="Comment">
          <i class="fas fa-comment"></i>
          <span class="comment-count">${
            (post.comments &&
              Array.isArray(post.comments) &&
              post.comments.length) ||
            0
          }</span>
        </button>
      </div>
      <!-- Counters - Hidden since they are in buttons -->
      <div class="text-muted small d-none">
        <span class="likes-count" id="likes-${
          post.id
        }" onclick="showLikesModal('${post.id}')" style="cursor: pointer;">${
        (post.likes && Array.isArray(post.likes) && post.likes.length) || 0
      } like${
        ((post.likes && Array.isArray(post.likes) && post.likes.length) ||
          0) !== 1
          ? "s"
          : ""
      }</span>
        <span class="comments-count ms-2" id="comments-${
          post.id
        }" onclick="toggleComments('${post.id}')" style="cursor: pointer;">${
        (post.comments &&
          Array.isArray(post.comments) &&
          post.comments.length) ||
        0
      } comment${
        ((post.comments &&
          Array.isArray(post.comments) &&
          post.comments.length) ||
          0) !== 1
          ? "s"
          : ""
      }</span>
      </div>
    </div>
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
            <div class="user-avatar-small me-2">
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
                    <button class="btn btn-outline-danger" onclick="deleteComment('${
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

  postsList.insertAdjacentHTML("beforeend", postsHTML);
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
        <div class="user-avatar-small me-2" style="width: 24px; height: 24px; font-size: 0.8rem;">
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

function likePost(postId) {
  fetch(`/posts/${postId}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(`[PROFILE] Like response:`, data);
      if (data.success) {
        // Update the like button appearance
        const likeBtn = document.getElementById(`like-btn-${postId}`);
        const likeIcon = likeBtn.querySelector("i");
        const likeText = likeBtn.textContent.trim();

        if (data.liked) {
          likeBtn.className = "btn btn-sm liked post-action-btn";
          likeIcon.style.color = "red";

          // Update the like count in the button
          const likeCount = likeBtn.querySelector(".like-count");
          if (likeCount) {
            const currentCount = parseInt(likeCount.textContent) || 0;
            likeCount.textContent = currentCount + 1;
          }
        } else {
          likeBtn.className = "btn btn-sm btn-outline-primary post-action-btn";
          likeIcon.style.color = "inherit";

          // Update the like count in the button
          const likeCount = likeBtn.querySelector(".like-count");
          if (likeCount) {
            const currentCount = parseInt(likeCount.textContent) || 1;
            likeCount.textContent = currentCount - 1;
          }
        }

        // Update like count
        const likesElement = document.getElementById(`likes-${postId}`);
        console.log(`[PROFILE] Likes element found:`, likesElement);
        console.log(`[PROFILE] Current likes text:`, likesElement?.textContent);
        console.log(`[PROFILE] New likes count:`, data.likesCount);
        if (likesElement) {
          likesElement.textContent = `${data.likesCount} like${
            data.likesCount !== 1 ? "s" : ""
          }`;
          console.log(
            `[PROFILE] Updated likes text:`,
            likesElement.textContent
          );
        }
      }
    })
    .catch((error) => {
      console.error("Error:", error);
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
        <div class="text-muted small d-none">
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

function handleCommentKeyPress(event, postId) {
  if (event.key === "Enter") {
    event.preventDefault();
    submitComment(postId);
  }
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

function addComment(event, postId) {
  event.preventDefault();
  submitComment(postId);
}

function submitComment(postId) {
  const commentInput = document.getElementById(`comment-input-${postId}`);
  const content = commentInput.value.trim();

  if (!content) {
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "alert alert-warning alert-dismissible fade show position-fixed";
    alertDiv.innerHTML = `
          <div><i class="fas fa-exclamation-triangle"></i> Please enter a comment.</div>
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
    return;
  }

  fetch(`/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        commentInput.value = "";

        // Refresh the comments list to show the new comment (dashboard approach)
        loadCommentsForPost(postId);

        // Add the new comment to the comments list
        const commentsList = document.getElementById(`comments-list-${postId}`);

        // Remove "No comments yet" message if it exists
        const noCommentsMsg = commentsList.querySelector(
          ".text-muted.text-center"
        );
        if (noCommentsMsg) {
          noCommentsMsg.remove();
        }

        const newComment = document.createElement("div");
        newComment.className = "comment-item p-3 border-bottom";
        newComment.setAttribute("data-comment-id", data.comment.id);

        // Use the backend response data for user information
        const commentUser = data.comment.user;

        newComment.innerHTML = `
          <div class="d-flex align-items-start">
            <div class="user-avatar-small me-2">
              ${getUserAvatar(commentUser)}
            </div>
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <small class="fw-bold">
                    <a href="/profile/${
                      commentUser.id
                    }" class="text-decoration-none">
                      ${commentUser.firstName || ""} ${
          commentUser.lastName || ""
        }
                    </a>
                  </small>
                  <div class="comment-content mt-1">${content}</div>
                  <small class="text-muted">${new Date().toLocaleDateString()}</small>
                </div>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-sm btn-outline-primary" onclick="editComment('${
                    data.comment.id
                  }', '${postId}', '${content.replace(
          /'/g,
          "\\'"
        )}')" title="Edit comment">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" onclick="deleteComment('${
                    data.comment.id
                  }')" title="Delete comment">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;

        commentsList.appendChild(newComment);

        // Update comment count in button
        const commentButton = document.querySelector(
          `[onclick="toggleComments('${postId}')"]`
        );
        if (commentButton) {
          const commentCount = commentButton.querySelector(".comment-count");
          if (commentCount) {
            const currentCount = parseInt(commentCount.textContent) || 0;
            commentCount.textContent = currentCount + 1;
          }
        }

        // Update comment count in real-time
        const commentsCountElement = document.getElementById(
          `comments-${postId}`
        );
        console.log(
          `[PROFILE] Comments count element found:`,
          commentsCountElement
        );
        console.log(
          `[PROFILE] Current comments text:`,
          commentsCountElement?.textContent
        );
        if (commentsCountElement) {
          // Extract just the number from the text (e.g., "5 comments" -> 5)
          const text = commentsCountElement.textContent;
          const match = text.match(/(\d+)/);
          const currentCount = match ? parseInt(match[1]) : 0;
          console.log(`[PROFILE] Extracted count:`, currentCount);
          commentsCountElement.textContent = `${currentCount + 1} comment${
            currentCount + 1 !== 1 ? "s" : ""
          }`;
          console.log(
            `[PROFILE] Updated comments text:`,
            commentsCountElement.textContent
          );
        }
      } else {
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-danger alert-dismissible fade show position-fixed";
        alertDiv.innerHTML = `
              <div><i class="fas fa-exclamation-triangle"></i> ${
                data.error || "Failed to submit comment"
              }</div>
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      const alertDiv = document.createElement("div");
      alertDiv.className =
        "alert alert-danger alert-dismissible fade show position-fixed";
      alertDiv.innerHTML = `
            <div><i class="fas fa-exclamation-triangle"></i> Failed to submit comment. Please try again.</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          `;
      document.body.appendChild(alertDiv);
      setTimeout(() => alertDiv.remove(), 5000);
    });
}

async function deleteComment(commentId, postId) {
  // Use custom confirmation modal instead of browser confirm
  const confirmed = await confirmDelete(
    "Are you sure you want to delete this comment?"
  );

  if (confirmed) {
    fetch(`/posts/comments/${commentId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Remove the comment from the DOM immediately
          const commentElement = document.querySelector(
            `[data-comment-id="${commentId}"]`
          );
          if (commentElement) {
            commentElement.remove();
          }

          // Check if this was the last comment and show "No comments yet" message
          const commentsList = document.getElementById(
            `comments-list-${postId}`
          );

          if (commentsList) {
            const remainingComments =
              commentsList.querySelectorAll(".comment-item");
            if (remainingComments.length === 0) {
              // No comments left, show the "No comments yet" message
              const noCommentsMsg = commentsList.querySelector(
                ".text-muted.text-center"
              );
              if (!noCommentsMsg) {
                const noCommentsElement = document.createElement("p");
                noCommentsElement.className = "text-muted text-center";
                noCommentsElement.textContent = "No comments yet";
                commentsList.appendChild(noCommentsElement);
              }
            }
          } else {
            console.log(`[PROFILE] Comments list not found for post ${postId}`);
          }

          // Also refresh the comments list to ensure consistency (dashboard approach)
          loadCommentsForPost(postId);

          // Update comment count in button
          const commentButton = document.querySelector(
            `[onclick="toggleComments('${postId}')"]`
          );
          if (commentButton) {
            const commentCount = commentButton.querySelector(".comment-count");
            if (commentCount) {
              const currentCount = parseInt(commentCount.textContent) || 1;
              const newCount = Math.max(0, currentCount - 1);
              commentCount.textContent = newCount;
            }
          }

          // Update comment count in real-time
          const commentsCountElement = document.getElementById(
            `comments-${postId}`
          );
          console.log(
            `[PROFILE] Delete comment - count element found:`,
            commentsCountElement
          );
          console.log(
            `[PROFILE] Delete comment - current text:`,
            commentsCountElement?.textContent
          );
          if (commentsCountElement) {
            // Extract just the number from the text (e.g., "5 comments" -> 5)
            const text = commentsCountElement.textContent;
            const match = text.match(/(\d+)/);
            const currentCount = match ? parseInt(match[1]) : 1;
            const newCount = Math.max(0, currentCount - 1);
            console.log(
              `[PROFILE] Delete comment - extracted count:`,
              currentCount,
              `new count:`,
              newCount
            );
            commentsCountElement.textContent = `${newCount} comment${
              newCount !== 1 ? "s" : ""
            }`;
            console.log(
              `[PROFILE] Delete comment - updated text:`,
              commentsCountElement.textContent
            );
          }
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
  updateCharCounterColor(charCountElement, currentContent.length, 200, 150);

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
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const editCommentModal = bootstrap.Modal.getInstance(
          document.getElementById("editCommentModal")
        );
        editCommentModal.hide();

        // Find and update the comment in the DOM
        const commentElement = document.querySelector(
          `[data-comment-id="${commentId}"]`
        );
        if (commentElement) {
          const commentContent =
            commentElement.querySelector(".comment-content");
          if (commentContent) {
            commentContent.textContent = content;
          }
        }

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

function showLikes(postId) {
  fetch(`/posts/${postId}/likes`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const likesList = document.getElementById("likesList");
        if (data.likes.length === 0) {
          likesList.innerHTML =
            '<p class="text-muted text-center">No likes yet</p>';
        } else {
          likesList.innerHTML = data.likes
            .map(
              (like) => `
                <div class="d-flex align-items-center p-2">
                  <div class="user-avatar-small me-2" style="width: 32px; height: 32px; font-size: 0.8rem;">
                    ${getUserAvatar(like.user)}
                  </div>
                  <div>
                    <div class="fw-bold">${like.user.firstName || ""} ${
                like.user.lastName || ""
              }</div>
                    <div class="text-muted small d-none">@${
                      like.user.username
                    }</div>
                  </div>
                </div>
              `
            )
            .join("");
        }
        likesModal.show();
      } else {
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-danger alert-dismissible fade show position-fixed";
        alertDiv.innerHTML = `
              <div><i class="fas fa-exclamation-triangle"></i> ${
                data.error || "Failed to load likes"
              }</div>
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      const alertDiv = document.createElement("div");
      alertDiv.className =
        "alert alert-danger alert-dismissible fade show position-fixed";
      alertDiv.innerHTML = `
            <div><i class="fas fa-exclamation-triangle"></i> Failed to load likes. Please try again.</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          `;
      document.body.appendChild(alertDiv);
      setTimeout(() => alertDiv.remove(), 5000);
    });
}

function switchToAllUsers() {
  window.location.href = "/friends/users";
}

function removeFriend(friendId, friendName) {
  // Get modal elements
  const unfriendModalElement = document.getElementById("unfriendModal");
  const unfriendUserName = document.getElementById("unfriendUserName");
  const confirmUnfriendBtn = document.getElementById("confirmUnfriendBtn");

  // Set the friend's name in the modal
  unfriendUserName.textContent = friendName;

  // Remove any existing event listeners by cloning the button
  confirmUnfriendBtn.replaceWith(confirmUnfriendBtn.cloneNode(true));

  // Get the fresh reference after cloning
  const freshConfirmBtn = document.getElementById("confirmUnfriendBtn");

  // Create or get existing modal instance
  let unfriendModal = bootstrap.Modal.getInstance(unfriendModalElement);
  if (!unfriendModal) {
    unfriendModal = new bootstrap.Modal(unfriendModalElement, {
      backdrop: true,
      keyboard: true,
      focus: true,
    });
  }

  // Add event listener for confirmation
  freshConfirmBtn.addEventListener("click", function () {
    // Close the modal
    unfriendModal.hide();

    // Show loading state on the button
    freshConfirmBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin me-1"></i>Removing...';
    freshConfirmBtn.disabled = true;

    // Send the unfriend request
    fetch("/friends/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const alertDiv = document.createElement("div");
          alertDiv.className =
            "alert alert-success alert-dismissible fade show position-fixed";
          alertDiv.innerHTML = `
                <div><i class="fas fa-user-minus"></i> ${friendName} removed from friends</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
              `;
          document.body.appendChild(alertDiv);

          // Refresh the page after successful unfriending
          setTimeout(() => {
            window.location.reload();
          }, 500); // Wait 0.5 seconds to show the notification, then refresh
        } else {
          const alertDiv = document.createElement("div");
          alertDiv.className =
            "alert alert-danger alert-dismissible fade show position-fixed";
          alertDiv.innerHTML = `
                <div><i class="fas fa-exclamation-triangle"></i> ${
                  data.error || "Failed to remove friend"
                }</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
              `;
          document.body.appendChild(alertDiv);
          setTimeout(() => alertDiv.remove(), 5000);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-danger alert-dismissible fade show position-fixed";
        alertDiv.innerHTML = `
              <div><i class="fas fa-exclamation-triangle"></i> Failed to remove friend. Please try again.</div>
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
      });
  });

  // Add event listener for modal hidden event to clean up
  unfriendModalElement.addEventListener(
    "hidden.bs.modal",
    function () {
      // Reset button state
      freshConfirmBtn.innerHTML =
        '<i class="fas fa-user-minus me-1"></i>Remove Friend';
      freshConfirmBtn.disabled = false;
    },
    { once: true }
  );

  // Show the modal
  unfriendModal.show();
}

// Function to cancel a sent friend request
function cancelFriendRequest(requestId, userName) {
  console.log(
    `[PROFILE] cancelFriendRequest called for request ${requestId} (${userName})`
  );

  // Find the cancel button for this specific request
  const cancelBtn = document.querySelector(`[data-request-id="${requestId}"]`);

  if (!cancelBtn) {
    console.error("Cancel button not found for request:", requestId);
    return;
  }

  // Show loading state on the cancel button
  const originalContent = cancelBtn.innerHTML;
  cancelBtn.innerHTML =
    '<i class="fas fa-spinner fa-spin me-1"></i>Cancelling...';
  cancelBtn.disabled = true;

  fetch("/friends/cancel-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Show success notification
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-success alert-dismissible fade show position-fixed";
        alertDiv.innerHTML = `
                <div><i class="fas fa-times"></i> Friend request to ${userName} cancelled</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
              `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 3000);

        // Refresh the page to update the UI
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        // Reset button state on error
        cancelBtn.innerHTML = originalContent;
        cancelBtn.disabled = false;

        // Show error notification
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-danger alert-dismissible fade show position-fixed";
        alertDiv.innerHTML = `
                <div><i class="fas fa-exclamation-triangle"></i> ${
                  data.error || "Failed to cancel request"
                }</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
              `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
      }
    })
    .catch((error) => {
      console.error("Error cancelling friend request:", error);

      // Reset button state on error
      cancelBtn.innerHTML = originalContent;
      cancelBtn.disabled = false;

      // Show error notification
      const alertDiv = document.createElement("div");
      alertDiv.className =
        "alert alert-danger alert-dismissible fade show position-fixed";
      alertDiv.innerHTML = `
              <div><i class="fas fa-exclamation-triangle"></i> Failed to cancel request. Please try again.</div>
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
      document.body.appendChild(alertDiv);
      setTimeout(() => alertDiv.remove(), 5000);
    });
}

// Bio editing functions
function editBio() {
  document.getElementById("bio-display").classList.add("d-none");
  document.getElementById("bio-edit").classList.remove("d-none");
  document.getElementById("bioTextarea").focus();
}

function cancelBioEdit() {
  document.getElementById("bio-display").classList.remove("d-none");
  document.getElementById("bio-edit").classList.add("d-none");
  // Reset textarea to original value
  document.getElementById("bioTextarea").value =
    document
      .getElementById("bioTextarea")
      .getAttribute("data-original-value") || "";
  document.getElementById("bioCharCount").textContent =
    document.getElementById("bioTextarea").value.length;
  document.getElementById("bioCharCount").style.color = "#6c757d";
}

function saveBio() {
  const bio = document.getElementById("bioTextarea").value.trim();

  if (bio.length > 500) {
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "alert alert-warning alert-dismissible fade show position-fixed";
    alertDiv.innerHTML = `
          <div><i class="fas fa-exclamation-triangle"></i> Bio cannot exceed 500 characters.</div>
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
    return;
  }

  const saveBtn = document.querySelector("#bio-edit .btn-primary");
  const originalText = saveBtn.innerHTML;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  saveBtn.disabled = true;

  fetch("/profile/bio", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bio }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Update the display without refreshing the page
        const bioDisplay = document.getElementById("bio-display");
        if (bio) {
          bioDisplay.innerHTML = `
          <p class="mb-3">${bio}</p>
          <button class="btn btn-outline-primary btn-sm" onclick="editBio()">
            <i class="fas fa-edit"></i> Edit Bio
          </button>
        `;
        } else {
          bioDisplay.innerHTML = `
          <p class="text-muted mb-3">No bio added yet.</p>
          <button class="btn btn-outline-primary btn-sm" onclick="editBio()">
            <i class="fas fa-plus"></i> Add Bio
          </button>
        `;
        }

        // Hide edit form
        document.getElementById("bio-edit").classList.add("d-none");
        document.getElementById("bio-display").classList.remove("d-none");

        // Show success notification
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-success alert-dismissible fade show position-fixed";
        alertDiv.innerHTML = `
              <div><i class="fas fa-check"></i> Bio updated successfully!</div>
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 3000);
      } else {
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-danger alert-dismissible fade show position-fixed";
        alertDiv.innerHTML = `
              <div><i class="fas fa-exclamation-triangle"></i> ${
                data.error || "Failed to save bio"
              }</div>
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      const alertDiv = document.createElement("div");
      alertDiv.className =
        "alert alert-danger alert-dismissible fade show position-fixed";
      alertDiv.innerHTML = `
            <div><i class="fas fa-exclamation-triangle"></i> Failed to save bio. Please try again.</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          `;
      document.body.appendChild(alertDiv);
      setTimeout(() => alertDiv.remove(), 5000);
    })
    .finally(() => {
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = false;
    });
}

function createInlinePost() {
  console.log(`[PROFILE] createInlinePost called`);
  const content = document.getElementById("inlinePostContent").value.trim();
  const photoFile = document.getElementById("inlinePostPhoto").files[0];
  console.log(`[PROFILE] Content: "${content}", Photo:`, photoFile);

  // Require either content (min 1 char) OR an image
  if (!content && !photoFile) {
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "alert alert-warning alert-dismissible fade show position-fixed";
    alertDiv.innerHTML = `
          <div><i class="fas fa-exclamation-triangle"></i> Please enter some content or add a photo for your post.</div>
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
    return;
  }

  if (content && content.length > 250) {
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "alert alert-warning alert-dismissible fade show position-fixed";
    alertDiv.innerHTML = `
          <div><i class="fas fa-exclamation-triangle"></i> Post content cannot exceed 250 characters.</div>
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
    return;
  }

  const createPostBtn = document.getElementById("inlineCreatePostBtn");
  const originalText = createPostBtn.innerHTML;
  createPostBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
  createPostBtn.disabled = true;

  // Create FormData for photo upload
  const formData = new FormData();
  if (content) formData.append("content", content);
  if (photoFile) formData.append("photo", photoFile);

  fetch("/posts", {
    method: "POST",
    body: formData, // Don't set Content-Type header for FormData
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        console.log(`[PROFILE] Post created successfully, clearing form...`);
        document.getElementById("inlinePostContent").value = "";
        document.getElementById("inlineCharCount").textContent = "0";
        console.log(
          `[PROFILE] Form cleared, content: "${
            document.getElementById("inlinePostContent").value
          }", count: ${document.getElementById("inlineCharCount").textContent}`
        );

        // Clear photo fields
        removeInlinePhoto();

        // Show success notification
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-success alert-dismissible fade show position-fixed";
        alertDiv.innerHTML = `
              <div><i class="fas fa-check"></i> Post created successfully!</div>
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 3000);

        // Full page refresh after 3 seconds to ensure everything is fresh
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-danger alert-dismissible fade show position-fixed";
        alertDiv.innerHTML = `
              <div><i class="fas fa-exclamation-triangle"></i> ${
                data.error || "Failed to create post"
              }</div>
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
      }
    })
    .catch((error) => {
      console.error("Error:", error);

      // Check if it's a JSON parsing error that suggests the post was created
      if (
        error.message.includes("Unexpected token") ||
        error.message.includes("JSON") ||
        error.message.includes("<!DOCTYPE")
      ) {
        console.log(
          "Detected HTML response instead of JSON, post may have been created successfully"
        );
        // Full page refresh since the post was likely created successfully
        setTimeout(() => {
          console.log("Forcing full page refresh due to JSON parsing error...");
          window.location.reload();
        }, 1000);

        // Also clear the form since we're assuming the post was created
        console.log(`[PROFILE] Clearing form due to JSON parsing error...`);
        document.getElementById("inlinePostContent").value = "";
        document.getElementById("inlineCharCount").textContent = "0";
        console.log(
          `[PROFILE] Form cleared, content: "${
            document.getElementById("inlinePostContent").value
          }", count: ${document.getElementById("inlineCharCount").textContent}`
        );
      } else {
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-danger alert-dismissible fade show position-fixed";
        alertDiv.innerHTML = `
              <div><i class="fas fa-exclamation-triangle"></i> Failed to create post. Please try again.</div>
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
      }
    })
    .finally(() => {
      createPostBtn.innerHTML = originalText;
      createPostBtn.disabled = false;
    });
}

// Missing functions that the dashboard uses
function openPhotoModal(photoUrl) {
  // Simple photo modal - you can enhance this with a proper modal library
  window.open(photoUrl, "_blank");
}

// Profile validation functions
function showEditUsernameStatus(message, type) {
  let feedback = document.getElementById("edit-username-feedback");
  if (!feedback) {
    feedback = document.createElement("div");
    feedback.id = "edit-username-feedback";
    feedback.className = "form-text";
    document.getElementById("editUsername").parentNode.appendChild(feedback);
  }

  feedback.textContent = message;
  feedback.className = `form-text ${type}`;

  // Update input styling
  const usernameInput = document.getElementById("editUsername");
  usernameInput.classList.remove("is-valid", "is-invalid");
  if (type === "text-success") {
    usernameInput.classList.add("is-valid");
  } else if (type === "text-danger") {
    usernameInput.classList.add("is-invalid");
  }
}

function showEditBirthdayStatus(message, type) {
  let feedback = document.getElementById("edit-birthday-feedback");
  if (!feedback) {
    feedback = document.createElement("div");
    feedback.id = "edit-birthday-feedback";
    feedback.className = "form-text";
    document.getElementById("editBirthday").parentNode.appendChild(feedback);
  }

  feedback.textContent = message;
  feedback.className = `form-text ${type}`;

  // Update input styling
  const birthdayInput = document.getElementById("editBirthday");
  birthdayInput.classList.remove("is-valid", "is-invalid");
  if (type === "text-success") {
    birthdayInput.classList.add("is-valid");
  } else if (type === "text-danger") {
    birthdayInput.classList.add("is-invalid");
  }
}

function validateEditBirthday(birthday) {
  if (!birthday) {
    showEditBirthdayStatus("", "");
    document
      .getElementById("editBirthday")
      .classList.remove("is-valid", "is-invalid");
    return true; // Birthday is optional
  }

  const birthDate = new Date(birthday);
  const today = new Date();

  // Check if it's a valid date
  if (isNaN(birthDate.getTime())) {
    showEditBirthdayStatus("Please enter a valid date", "text-danger");
    return false;
  }

  // Check if date is in the future
  if (birthDate > today) {
    showEditBirthdayStatus("Birthday cannot be in the future", "text-danger");
    return false;
  }

  // Calculate age
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  let actualAge = age;
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    actualAge = age - 1;
  }

  if (actualAge < 16) {
    showEditBirthdayStatus("You must be at least 16 years old", "text-danger");
    return false;
  }

  // Valid age
  showEditBirthdayStatus("", "");
  return true;
}

let editUsernameCheckTimeout;
let isCheckingEditUsername = false;

function checkEditUsernameAvailability(username, currentUsername) {
  // Don't check if username hasn't changed
  if (username === currentUsername) {
    showEditUsernameStatus("", "");
    document
      .getElementById("editUsername")
      .classList.remove("is-valid", "is-invalid");
    return;
  }

  if (isCheckingEditUsername) return;

  isCheckingEditUsername = true;
  showEditUsernameStatus("Checking availability...", "text-muted");
  document.getElementById("editUsername").classList.add("username-checking");

  fetch(`/auth/check-username/${encodeURIComponent(username)}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.available) {
        showEditUsernameStatus(data.message, "text-success");
      } else {
        showEditUsernameStatus(data.message, "text-danger");
      }
    })
    .catch((error) => {
      console.error("Error checking username:", error);
      showEditUsernameStatus(
        "Error checking username availability",
        "text-danger"
      );
    })
    .finally(() => {
      isCheckingEditUsername = false;
      document
        .getElementById("editUsername")
        .classList.remove("username-checking");
    });
}

function validateEditUsername(username, currentUsername) {
  if (!username) {
    showEditUsernameStatus("", "");
    document
      .getElementById("editUsername")
      .classList.remove("is-valid", "is-invalid");
    return false;
  }

  // Basic validation
  if (username.length < 3) {
    showEditUsernameStatus(
      "Username must be at least 3 characters",
      "text-danger"
    );
    return false;
  }

  if (username.length > 30) {
    showEditUsernameStatus(
      "Username must be less than 30 characters",
      "text-danger"
    );
    return false;
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    showEditUsernameStatus(
      "Username can only contain letters, numbers, and underscores",
      "text-danger"
    );
    return false;
  }

  // Check availability if username changed
  if (username !== currentUsername) {
    // Clear previous timeout
    if (editUsernameCheckTimeout) {
      clearTimeout(editUsernameCheckTimeout);
    }

    // Debounce the API call
    editUsernameCheckTimeout = setTimeout(() => {
      checkEditUsernameAvailability(username, currentUsername);
    }, 500);
  } else {
    showEditUsernameStatus("", "");
    document
      .getElementById("editUsername")
      .classList.remove("is-valid", "is-invalid");
  }

  return true;
}

// Profile editing functions
function openEditProfileModal() {
  // Pre-fill the form with current user data
  document.getElementById("editFirstName").value =
    document.querySelector(".profile-name").textContent.trim().split(" ")[0] ||
    "";
  document.getElementById("editLastName").value =
    document
      .querySelector(".profile-name")
      .textContent.trim()
      .split(" ")
      .slice(1)
      .join(" ") || "";
  document.getElementById("editUsername").value =
    document
      .querySelector(".profile-username")
      .textContent.replace("@", "")
      .trim() || "";

  editProfileModal.show();
}

function updateProfileDisplay(user) {
  // Update profile name
  const profileName = document.querySelector(".profile-name");
  if (profileName) {
    profileName.textContent = `${user.firstName} ${user.lastName}`;
  }

  // Update profile username
  const profileUsername = document.querySelector(".profile-username");
  if (profileUsername) {
    profileUsername.textContent = `@${user.username}`;
  }

  // Update profile avatar
  const profileAvatar = document.querySelector(".profile-picture");
  if (profileAvatar) {
    profileAvatar.textContent = `${user.firstName.charAt(
      0
    )}${user.lastName.charAt(0)}`;
  }

  // Update header avatar
  const headerAvatar = document.querySelector(".user-avatar");
  if (headerAvatar) {
    headerAvatar.textContent = `${user.firstName.charAt(
      0
    )}${user.lastName.charAt(0)}`;
  }

  // Update profile information section
  updateProfileInfo(user);
}

function updateProfileInfo(user) {
  // Update joined date (this won't change, but included for completeness)
  const joinedDateElement = document.querySelector(
    ".info-item:has(.fa-calendar-alt)"
  );
  if (joinedDateElement) {
    const options = { year: "numeric", month: "long" };
    const formattedDate = new Date(
      user.createdAt || new Date()
    ).toLocaleDateString("en-US", options);
    joinedDateElement.querySelector("span:last-child").textContent =
      formattedDate;
  }

  // Update birthday
  const birthdayElement = document.querySelector(
    ".info-item:has(.fa-birthday-cake)"
  );
  if (user.birthday) {
    const birthday = new Date(user.birthday);
    const birthdayOptions = { month: "long", day: "numeric", year: "numeric" };
    const formattedBirthday = birthday.toLocaleDateString(
      "en-US",
      birthdayOptions
    );

    if (birthdayElement) {
      birthdayElement.querySelector("span:last-child").textContent =
        formattedBirthday;
    } else {
      // Create birthday element if it doesn't exist
      const profileInfo = document.querySelector(".profile-info");
      if (profileInfo) {
        const newBirthdayElement = document.createElement("div");
        newBirthdayElement.className =
          "info-item d-flex align-items-center mb-2";
        newBirthdayElement.innerHTML = `
          <i class="fas fa-birthday-cake me-2 text-muted"></i>
          <span class="text-muted">Birthday: </span>
          <span class="ms-1">${formattedBirthday}</span>
        `;
        profileInfo.appendChild(newBirthdayElement);
      }
    }
  }

  // Update gender
  const genderElement = document.querySelector(".info-item:has(.fa-user)");
  if (user.gender) {
    if (genderElement) {
      genderElement.querySelector("span:last-child").textContent = user.gender;
    } else {
      // Create gender element if it doesn't exist
      const profileInfo = document.querySelector(".profile-info");
      if (profileInfo) {
        const newGenderElement = document.createElement("div");
        newGenderElement.className = "info-item d-flex align-items-center mb-2";
        newGenderElement.innerHTML = `
          <i class="fas fa-user me-2 text-muted"></i>
          <span class="text-muted">Gender: </span>
          <span class="ms-1">${user.gender}</span>
        `;
        profileInfo.appendChild(newGenderElement);
      }
    }
  }

  // Update location
  const locationElement = document.querySelector(
    ".info-item:has(.fa-map-marker-alt)"
  );
  if (user.location) {
    if (locationElement) {
      locationElement.querySelector("span:last-child").textContent =
        user.location;
    } else {
      // Create location element if it doesn't exist
      const profileInfo = document.querySelector(".profile-info");
      if (profileInfo) {
        const newLocationElement = document.createElement("div");
        newLocationElement.className =
          "info-item d-flex align-items-center mb-2";
        newLocationElement.innerHTML = `
          <i class="fas fa-map-marker-alt me-2 text-muted"></i>
          <span class="text-muted">Location: </span>
          <span class="ms-1">${user.location}</span>
        `;
        profileInfo.appendChild(newLocationElement);
      }
    }
  }
}

function saveProfileChanges() {
  const firstName = document.getElementById("editFirstName").value.trim();
  const lastName = document.getElementById("editLastName").value.trim();
  const username = document.getElementById("editUsername").value.trim();
  const birthday = document.getElementById("editBirthday").value;
  const gender = document.getElementById("editGender").value;
  const location = document.getElementById("editLocation").value.trim();

  // Debug: Log the values being collected
  console.log("Profile data being sent:", {
    firstName,
    lastName,
    username,
    birthday,
    gender,
    location,
  });

  // Get current username for comparison
  const currentUsername = document
    .querySelector(".profile-username")
    .textContent.replace("@", "")
    .trim();

  // Validate input
  if (!firstName || !lastName || !username) {
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "alert alert-warning alert-dismissible fade show position-fixed";
    alertDiv.innerHTML = `
          <div><i class="fas fa-exclamation-triangle"></i> All fields are required.</div>
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
    return;
  }

  if (firstName.length > 50 || lastName.length > 50) {
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "alert alert-warning alert-dismissible fade show position-fixed";
    alertDiv.innerHTML = `
          <div><i class="fas fa-exclamation-triangle"></i> Name fields cannot exceed 50 characters.</div>
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
    return;
  }

  // Validate username using new validation function
  if (!validateEditUsername(username, currentUsername)) {
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "alert alert-warning alert-dismissible fade show position-fixed";
    alertDiv.innerHTML = `
          <div><i class="fas fa-exclamation-triangle"></i> Please enter a valid username.</div>
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
    return;
  }

  // Check if username is invalid (has is-invalid class)
  if (
    document.getElementById("editUsername").classList.contains("is-invalid")
  ) {
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "alert alert-warning alert-dismissible fade show position-fixed";
    alertDiv.innerHTML = `
          <div><i class="fas fa-exclamation-triangle"></i> Please choose a different username.</div>
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
    return;
  }

  // If we're still checking username availability, prevent submission
  if (isCheckingEditUsername) {
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "alert alert-warning alert-dismissible fade show position-fixed";
    alertDiv.innerHTML = `
          <div><i class="fas fa-exclamation-triangle"></i> Please wait while we check username availability...</div>
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
    return;
  }

  // Validate birthday using new validation function
  if (!validateEditBirthday(birthday)) {
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "alert alert-warning alert-dismissible fade show position-fixed";
    alertDiv.innerHTML = `
          <div><i class="fas fa-exclamation-triangle"></i> Please enter a valid birthday.</div>
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
    return;
  }

  const saveBtn = document.getElementById("saveProfileBtn");
  const originalText = saveBtn.innerHTML;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  saveBtn.disabled = true;

  // Prepare data - convert empty strings to null for optional fields
  const profileData = {
    firstName,
    lastName,
    username,
    birthday: birthday || null,
    gender: gender || null,
    location: location || null,
  };

  // Update profile information
  fetch("/profile/update", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Profile update response:", data);

      if (data.success) {
        // Hide the modal first
        const modalInstance = bootstrap.Modal.getInstance(
          document.getElementById("editProfileModal")
        );
        if (modalInstance) {
          modalInstance.hide();
        }

        // Show success notification
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-success alert-dismissible fade show position-fixed";
        alertDiv.style.cssText = "top: 20px; right: 20px; z-index: 9999;";
        alertDiv.innerHTML = `
              <div><i class="fas fa-check"></i> Profile updated successfully!</div>
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
        document.body.appendChild(alertDiv);

        // Remove the notification after 2 seconds and refresh page
        setTimeout(() => {
          alertDiv.remove();
          // Refresh the page to show updated profile information
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(data.error || "Failed to update profile");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      const alertDiv = document.createElement("div");
      alertDiv.className =
        "alert alert-danger alert-dismissible fade show position-fixed";
      alertDiv.style.cssText = "top: 20px; right: 20px; z-index: 9999;";
      alertDiv.innerHTML = `
            <div><i class="fas fa-exclamation-triangle"></i> ${
              error.message || "Failed to update profile. Please try again."
            }</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          `;
      document.body.appendChild(alertDiv);
      setTimeout(() => alertDiv.remove(), 5000);
    })
    .finally(() => {
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = false;
    });
}

// Profile picture upload functionality
function handleProfilePictureUpload(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "alert alert-danger alert-dismissible fade show position-fixed";
    alertDiv.innerHTML = `
      <div><i class="fas fa-exclamation-triangle"></i> Please select a valid image file.</div>
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "alert alert-danger alert-dismissible fade show position-fixed";
    alertDiv.innerHTML = `
      <div><i class="fas fa-exclamation-triangle"></i> Image size must be less than 5MB.</div>
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
    return;
  }

  // Create FormData for file upload
  const formData = new FormData();
  formData.append("profilePicture", file);

  // Show loading state
  const profilePicture = document.getElementById("profilePicture");
  const originalContent = profilePicture.innerHTML;
  profilePicture.innerHTML =
    '<i class="fas fa-spinner fa-spin loading-spinner-large"></i>';

  // Upload the image
  fetch("/profile/upload-picture", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Update the profile picture with the new image and recreate the overlay
        profilePicture.innerHTML = `
          <img src="${data.profilePicture}" alt="Profile Picture" class="profile-image">
          <div class="profile-picture-overlay">
            <label for="profilePictureInput" class="profile-picture-upload-btn">
              <i class="fas fa-camera"></i>
              <span>Change Photo</span>
            </label>
          </div>
        `;

        // Update header avatar immediately
        const headerAvatar = document.querySelector(".user-avatar");
        if (headerAvatar) {
          headerAvatar.innerHTML = `<img src="${data.profilePicture}" alt="Profile Picture" class="profile-image">`;
        }

        // Update all other profile picture instances on the page
        const allProfileImages = document.querySelectorAll(".profile-image");
        allProfileImages.forEach((img) => {
          if (img.src !== data.profilePicture) {
            img.src = data.profilePicture;
          }
        });

        // Update user-avatar-large instances (like in create post section)
        const userAvatarLarge = document.querySelectorAll(".user-avatar-large");
        userAvatarLarge.forEach((avatar) => {
          const existingImg = avatar.querySelector(".profile-image");
          if (existingImg) {
            existingImg.src = data.profilePicture;
          } else {
            // If no image exists, create one
            avatar.innerHTML = `<img src="${data.profilePicture}" alt="Profile Picture" class="profile-image">`;
          }
        });

        // Show success notification
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-success alert-dismissible fade show position-fixed";
        alertDiv.innerHTML = `
           <div><i class="fas fa-check"></i> Profile picture updated successfully!</div>
           <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
         `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 3000);
      } else {
        // Restore original content on error
        profilePicture.innerHTML = originalContent;

        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-danger alert-dismissible fade show position-fixed";
        alertDiv.innerHTML = `
        <div><i class="fas fa-exclamation-triangle"></i> ${
          data.error || "Failed to upload profile picture"
        }</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      // Restore original content on error
      profilePicture.innerHTML = originalContent;

      const alertDiv = document.createElement("div");
      alertDiv.className =
        "alert alert-danger alert-dismissible fade show position-fixed";
      alertDiv.innerHTML = `
      <div><i class="fas fa-exclamation-triangle"></i> Failed to upload profile picture. Please try again.</div>
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
      document.body.appendChild(alertDiv);
      setTimeout(() => alertDiv.remove(), 5000);
    });
}

// Photo handling functions for posts
function initializePhotoHandling() {
  // Handle photo selection for inline post form
  const inlinePostPhoto = document.getElementById("inlinePostPhoto");
  if (inlinePostPhoto) {
    inlinePostPhoto.addEventListener("change", function (event) {
      handleInlinePhotoSelection(event);
    });
  }

  // Handle photo selection for create post modal
  const postPhoto = document.getElementById("postPhoto");
  if (postPhoto) {
    postPhoto.addEventListener("change", function (event) {
      handlePhotoSelection(event);
    });
  }
}

function handleInlinePhotoSelection(event) {
  const file = event.target.files[0];
  if (file) {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      showNotification("Please select a valid image file.", "warning");
      event.target.value = "";
      return;
    }

    // Validate file size (max 10MB for post photos)
    if (file.size > 10 * 1024 * 1024) {
      showNotification("Image size must be less than 10MB.", "warning");
      event.target.value = "";
      return;
    }

    // Show filename and remove button
    document.getElementById("inlinePhotoFileName").textContent = file.name;
    document
      .getElementById("inlineRemovePhotoBtn")
      .classList.remove("hidden-button");
  }
}

function handlePhotoSelection(event) {
  const file = event.target.files[0];
  if (file) {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      showNotification("Please select a valid image file.", "warning");
      event.target.value = "";
      return;
    }

    // Validate file size (max 10MB for post photos)
    if (file.size > 10 * 1024 * 1024) {
      showNotification("Image size must be less than 10MB.", "warning");
      event.target.value = "";
      return;
    }

    // Show filename and remove button
    document.getElementById("photoFileName").textContent = file.name;
    document.getElementById("removePhotoBtn").style.display = "inline-block";
  }
}

function removeInlinePhoto() {
  document.getElementById("inlinePostPhoto").value = "";
  document.getElementById("inlinePhotoFileName").textContent = "";
  document
    .getElementById("inlineRemovePhotoBtn")
    .classList.add("hidden-button");
}

function removeModalPhoto() {
  document.getElementById("modalPostPhoto").value = "";
  document.getElementById("modalPhotoFileName").textContent = "";
  document.getElementById("modalRemovePhotoBtn").style.display = "none";
}

function removePhoto() {
  document.getElementById("postPhoto").value = "";
  document.getElementById("photoFileName").textContent = "";
  document.getElementById("removePhotoBtn").style.display = "none";
}

// Function to open the view all friends modal
function openViewAllFriendsModal() {
  if (viewAllFriendsModal) {
    viewAllFriendsModal.show();
  }
}

// Make the function globally available
window.openViewAllFriendsModal = openViewAllFriendsModal;
