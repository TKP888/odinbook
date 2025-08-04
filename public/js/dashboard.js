// Initialize modals
let createPostModal;
let editPostModal;

// Get current user ID from the page
const currentUserId = document
  .querySelector('meta[name="user-id"]')
  ?.getAttribute("content");

// Load posts when page loads
document.addEventListener("DOMContentLoaded", function () {
  loadPosts();
  initializeModals();
  initializeInlinePost();
});

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

  if (!content) {
    alert("Please enter some content for your post.");
    return;
  }

  if (content.length > 250) {
    alert("Post content cannot exceed 250 characters.");
    return;
  }

  const createPostBtn = document.getElementById("inlineCreatePostBtn");
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
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Clear the form
        document.getElementById("inlinePostContent").value = "";
        document.getElementById("inlineCharCount").textContent = "0";
        document.getElementById("inlineCharCount").style.color = "#6c757d";

        loadPosts(); // Refresh posts list

        // Show success notification
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-success alert-dismissible fade show position-fixed";
        alertDiv.style.cssText =
          "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
        alertDiv.innerHTML = `
  <i class="fas fa-check"></i> Post created successfully!
  <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
`;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 3000);
      } else {
        alert(data.error || "Failed to create post");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Failed to create post. Please try again.");
    })
    .finally(() => {
      createPostBtn.innerHTML = originalText;
      createPostBtn.disabled = false;
    });
}

function createPost() {
  const content = document.getElementById("postContent").value.trim();

  if (!content) {
    alert("Please enter some content for your post.");
    return;
  }

  if (content.length > 250) {
    alert("Post content cannot exceed 250 characters.");
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
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        createPostModal.hide();
        loadPosts(); // Refresh posts list

        // Show success notification
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-success alert-dismissible fade show position-fixed";
        alertDiv.style.cssText =
          "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
        alertDiv.innerHTML = `
  <i class="fas fa-check"></i> Post created successfully!
  <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
`;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 3000);
      } else {
        alert(data.error || "Failed to create post");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Failed to create post. Please try again.");
    })
    .finally(() => {
      createPostBtn.innerHTML = originalText;
      createPostBtn.disabled = false;
    });
}

function loadPosts() {
  const postsLoading = document.getElementById("postsLoading");
  const postsList = document.getElementById("postsList");
  const noPosts = document.getElementById("noPosts");

  postsLoading.classList.remove("d-none");
  postsList.classList.add("d-none");
  noPosts.classList.add("d-none");

  fetch("/posts")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      postsLoading.classList.add("d-none");
      if (data.posts && data.posts.length > 0) {
        displayPosts(data.posts);
        updatePostsCount(data.posts.length);
      } else {
        noPosts.classList.remove("d-none");
      }
    })
    .catch((error) => {
      console.error("Error loading posts:", error);
      postsLoading.classList.add("d-none");
      noPosts.classList.remove("d-none");
    });
}

function displayPosts(posts) {
  const postsList = document.getElementById("postsList");
  const noPosts = document.getElementById("noPosts");

  if (posts.length === 0) {
    postsList.classList.add("d-none");
    noPosts.classList.remove("d-none");
    return;
  }

  noPosts.classList.add("d-none");
  postsList.classList.remove("d-none");

  postsList.innerHTML = posts
    .map(
      (post) => `
<div class="post-item mb-4 p-3 border rounded">
  <div class="d-flex align-items-start mb-3">
    <div class="user-avatar-small me-3" style="width: 40px; height: 40px; font-size: 1rem;">
      ${(post.user.firstName || "").charAt(0)}${(
        post.user.lastName || ""
      ).charAt(0)}
    </div>
    <div class="flex-grow-1">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h6 class="mb-1">
            <a href="/profile/${post.user.id}" class="text-decoration-none">
              ${post.user.firstName || ""} ${post.user.lastName || ""}
            </a>
            <span class="text-muted small">@${post.user.username}</span>
          </h6>
          <small class="text-muted">


            ${formatDateTime(post.createdAt)}
          </small>
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
  <div class="post-content">${post.content.replace(/\n/g, "<br>")}</div>

  <!-- Post Actions -->
  <div class="post-actions mt-3 pt-3 border-top">
    <div class="d-flex justify-content-between align-items-center">
      <!-- Action Buttons -->
      <div class="d-flex gap-2">
        <button class="btn btn-sm ${
          post.likes.some((like) => like.user.id === currentUserId)
            ? "liked"
            : "btn-outline-primary"
        } like-btn" id="like-btn-${post.id}" onclick="likePost('${
        post.id
      }')" data-post-id="${post.id}">
          <i class="fas fa-heart"></i> Like
        </button>
        <button class="btn btn-sm btn-outline-secondary" onclick="toggleComments('${
          post.id
        }')">
          <i class="fas fa-comment"></i> Comment
        </button>
      </div>
      <!-- Counters -->
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

  <!-- Comments Section -->
  <div class="comments-section mt-3 d-none" id="comments-section-${post.id}">
    <div class="comments-list mb-3" id="comments-list-${post.id}">
      ${
        post.comments && post.comments.length > 0
          ? post.comments
              .map(
                (comment) => `
        <div class="comment-item p-2 border-bottom">
          <div class="d-flex align-items-start">
            <div class="user-avatar-small me-2" style="width: 24px; height: 24px; font-size: 0.7rem;">
              ${(comment.user.firstName || "").charAt(0)}${(
                  comment.user.lastName || ""
                ).charAt(0)}
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

function updatePostsCount(count) {
  const postsCountElement = document.getElementById("postsCount");
  if (postsCountElement) {
    postsCountElement.textContent = `${count} post${count !== 1 ? "s" : ""}`;
  }
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

function deletePost(postId) {
  if (confirm("Are you sure you want to delete this post?")) {
    fetch(`/posts/${postId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          loadPosts(); // Refresh posts list

          // Show success notification
          const alertDiv = document.createElement("div");
          alertDiv.className =
            "alert alert-info alert-dismissible fade show position-fixed";
          alertDiv.style.cssText =
            "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
          alertDiv.innerHTML = `
   Post deleted
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
          document.body.appendChild(alertDiv);
          setTimeout(() => alertDiv.remove(), 3000);
        } else {
          alert(data.error || "Failed to delete post");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Failed to delete post. Please try again.");
      });
  }
}

function editPost(postId) {
  // Fetch the post data and open edit modal
  fetch(`/posts/${postId}`)
    .then((response) => response.json())
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
          alert("You can only edit your own posts.");
        }
      } else {
        alert("Post not found.");
      }
    })
    .catch((error) => {
      console.error("Error fetching post:", error);
      alert("Failed to load post for editing.");
    });
}

function saveEditedPost() {
  const postId = document.getElementById("editPostId").value;
  const content = document.getElementById("editPostContent").value.trim();

  if (!content) {
    alert("Please enter some content for your post.");
    return;
  }

  if (content.length > 250) {
    alert("Post content cannot exceed 250 characters.");
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
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        editPostModal.hide();
        loadPosts(); // Refresh posts list

        // Show success notification
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-success alert-dismissible fade show position-fixed";
        alertDiv.style.cssText =
          "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
        alertDiv.innerHTML = `
  <i class="fas fa-check"></i> Post updated successfully!
  <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
`;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 3000);
      } else {
        alert(data.error || "Failed to update post");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Failed to update post. Please try again.");
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
          icon.style.color = "white";

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
    <div class="comment-item p-2 border-bottom">
      <div class="d-flex align-items-start">
        <div class="user-avatar-small me-2" style="width: 24px; height: 24px; font-size: 0.7rem;">
          ${(comment.user.firstName || "").charAt(0)}${(
              comment.user.lastName || ""
            ).charAt(0)}
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
        ${(like.user.firstName || "").charAt(0)}${(
              like.user.lastName || ""
            ).charAt(0)}
      </div>
      <div class="flex-grow-1">
        <div class="fw-bold">
          <a href="/profile/${like.user.id}" class="text-decoration-none">
            ${like.user.firstName || ""} ${like.user.lastName || ""}
          </a>
        </div>
        <div class="text-muted small">@${like.user.username}</div>
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

function submitComment(postId) {
  const commentInput = document.getElementById(`comment-input-${postId}`);
  const comment = commentInput.value.trim();

  if (!comment) {
    alert("Please enter a comment.");
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
        alert(data.error || "Failed to add comment");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Failed to add comment. Please try again.");
    });
}

function deleteComment(commentId, postId) {
  if (confirm("Are you sure you want to delete this comment?")) {
    fetch(`/posts/comments/${commentId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Refresh the comments list to reflect the deletion
          loadCommentsForPost(postId);

          showNotification("Comment deleted!", "success");
        } else {
          alert(data.error || "Failed to delete comment");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Failed to delete comment. Please try again.");
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
    alert("Please enter some content for your comment.");
    return;
  }

  if (content.length > 250) {
    alert("Comment content cannot exceed 250 characters.");
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
        alert(data.error || "Failed to update comment");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Failed to update comment. Please try again.");
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
