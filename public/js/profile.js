// Extracted from views/profile/index.ejs (profile logic)

// Initialize modals
let createPostModal;
let editPostModal;
let likesModal;
let editProfileModal;

// Get current user ID from the page
const currentUserId = document
  .querySelector('meta[name="user-id"]')
  ?.getAttribute("content");

document.addEventListener("DOMContentLoaded", function () {
  createPostModal = new bootstrap.Modal(
    document.getElementById("createPostModal")
  );
  editPostModal = new bootstrap.Modal(document.getElementById("editPostModal"));
  likesModal = new bootstrap.Modal(document.getElementById("likesModal"));
  editProfileModal = new bootstrap.Modal(
    document.getElementById("editProfileModal")
  );

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
        charCount > 200 ? "#dc3545" : charCount > 150 ? "#ffc107" : "#6c757d";
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

  // Add edit post handlers
  document.querySelectorAll(".edit-post-btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const postId = this.dataset.postId;
      const content = this.dataset.postContent;
      editPost(postId, content);
    });
  });

  // Add delete post handlers
  document.querySelectorAll(".delete-post-btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const postId = this.dataset.postId;
      deletePost(postId);
    });
  });

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

  if (!content) {
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "alert alert-warning alert-dismissible fade show position-fixed";
    alertDiv.innerHTML = `
          <div><i class="fas fa-exclamation-triangle"></i> Please enter some content for your post.</div>
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
    return;
  }

  if (content.length > 250) {
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

  const createBtn = document.getElementById("createPostBtn");
  const originalText = createBtn.innerHTML;
  createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
  createBtn.disabled = true;

  fetch("/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        createPostModal.hide();

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

        // Optionally reload after a short delay to show the new post
        setTimeout(() => {
          location.reload();
        }, 1000);
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
      const alertDiv = document.createElement("div");
      alertDiv.className =
        "alert alert-danger alert-dismissible fade show position-fixed";
      alertDiv.innerHTML = `
            <div><i class="fas fa-exclamation-triangle"></i> Failed to create post. Please try again.</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          `;
      document.body.appendChild(alertDiv);
      setTimeout(() => alertDiv.remove(), 5000);
    })
    .finally(() => {
      createBtn.innerHTML = originalText;
      createBtn.disabled = false;
    });
}

function editPost(postId, content) {
  document.getElementById("editPostId").value = postId;
  document.getElementById("editPostContent").value = content;
  document.getElementById("editCharCount").textContent = content.length;
  editPostModal.show();
}

function saveEditedPost() {
  const content = document.getElementById("editPostContent").value.trim();

  if (!content) {
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "alert alert-warning alert-dismissible fade show position-fixed";
    alertDiv.innerHTML = `
          <div><i class="fas fa-exclamation-triangle"></i> Please enter some content for your post.</div>
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
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
        location.reload(); // Refresh to show the updated post
      } else {
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-danger alert-dismissible fade show position-fixed";
        alertDiv.innerHTML = `
              <div><i class="fas fa-exclamation-triangle"></i> ${
                data.error || "Failed to update post"
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
            <div><i class="fas fa-exclamation-triangle"></i> Failed to update post. Please try again.</div>
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

function deletePost(postId) {
  if (confirm("Are you sure you want to delete this post?")) {
    fetch(`/posts/${postId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          location.reload(); // Refresh to remove the deleted post
        } else {
          const alertDiv = document.createElement("div");
          alertDiv.className =
            "alert alert-danger alert-dismissible fade show position-fixed";
          alertDiv.innerHTML = `
                <div><i class="fas fa-exclamation-triangle"></i> ${
                  data.error || "Failed to delete post"
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
              <div><i class="fas fa-exclamation-triangle"></i> Failed to delete post. Please try again.</div>
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
      });
  }
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
          icon.style.color = "white";

          // Update likes count
          const likesElement = document.querySelector(
            `[data-post-id="${postId}"] .likes-count`
          );
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
          const likesElement = document.querySelector(
            `[data-post-id="${postId}"] .likes-count`
          );
          const currentLikes = parseInt(likesElement.textContent) || 1;
          likesElement.textContent = `${currentLikes - 1} like${
            currentLikes - 1 !== 1 ? "s" : ""
          }`;
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
  const commentsSection = document.getElementById(`comments-${postId}`);
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

function handleCommentKeyPress(event, postId) {
  if (event.key === "Enter") {
    event.preventDefault();
    submitComment(postId);
  }
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

        // Update comment count
        const commentsElement = document.querySelector(
          `[data-post-id="${postId}"] .comments-count`
        );
        const currentComments = parseInt(commentsElement.textContent) || 0;
        commentsElement.textContent = `${currentComments + 1} comment${
          currentComments + 1 !== 1 ? "s" : ""
        }`;

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
            <div class="user-avatar-small me-2" style="width: 24px; height: 24px; font-size: 0.7rem;">
              ${(commentUser.firstName || "").charAt(0)}${(
          commentUser.lastName || ""
        ).charAt(0)}
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

        // Show success notification
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-success alert-dismissible fade show position-fixed";
        alertDiv.innerHTML = `
              <div><i class="fas fa-check"></i> Comment added successfully!</div>
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
                data.error || "Failed to add comment"
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
            <div><i class="fas fa-exclamation-triangle"></i> Failed to add comment. Please try again.</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          `;
      document.body.appendChild(alertDiv);
      setTimeout(() => alertDiv.remove(), 5000);
    });
}

function deleteComment(commentId) {
  if (confirm("Are you sure you want to delete this comment?")) {
    fetch(`/posts/comments/${commentId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          location.reload(); // Refresh to remove the deleted comment
        } else {
          const alertDiv = document.createElement("div");
          alertDiv.className =
            "alert alert-danger alert-dismissible fade show position-fixed";
          alertDiv.innerHTML = `
                <div><i class="fas fa-exclamation-triangle"></i> ${
                  data.error || "Failed to delete comment"
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
              <div><i class="fas fa-exclamation-triangle"></i> Failed to delete comment. Please try again.</div>
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
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
                  <div class="user-avatar-small me-2">
                    ${(like.user.firstName || "").charAt(0)}${(
                like.user.lastName || ""
              ).charAt(0)}
                  </div>
                  <div>
                    <div class="fw-bold">${like.user.firstName || ""} ${
                like.user.lastName || ""
              }</div>
                    <div class="text-muted small">@${like.user.username}</div>
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
  if (
    confirm(`Are you sure you want to remove ${friendName} from your friends?`)
  ) {
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
          setTimeout(() => alertDiv.remove(), 3000);

          location.reload(); // Refresh the page to update the friends list
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
  }
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
  const content = document.getElementById("inlinePostContent").value.trim();

  if (!content) {
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "alert alert-warning alert-dismissible fade show position-fixed";
    alertDiv.innerHTML = `
          <div><i class="fas fa-exclamation-triangle"></i> Please enter some content for your post.</div>
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
    return;
  }

  if (content.length > 250) {
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

  fetch("/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        document.getElementById("inlinePostContent").value = "";
        document.getElementById("inlineCharCount").textContent = "0";

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

        // Reload after a short delay to show the new post
        setTimeout(() => {
          location.reload();
        }, 1000);
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
      const alertDiv = document.createElement("div");
      alertDiv.className =
        "alert alert-danger alert-dismissible fade show position-fixed";
      alertDiv.innerHTML = `
            <div><i class="fas fa-exclamation-triangle"></i> Failed to create post. Please try again.</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          `;
      document.body.appendChild(alertDiv);
      setTimeout(() => alertDiv.remove(), 5000);
    })
    .finally(() => {
      createPostBtn.innerHTML = originalText;
      createPostBtn.disabled = false;
    });
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

  if (username.length < 3 || username.length > 30) {
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "alert alert-warning alert-dismissible fade show position-fixed";
    alertDiv.innerHTML = `
          <div><i class="fas fa-exclamation-triangle"></i> Username must be between 3 and 30 characters.</div>
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

  fetch("/profile/update", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName,
      lastName,
      username,
      birthday,
      gender,
      location,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Hide the modal first
        editProfileModal.hide();

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

        // Update profile information dynamically
        updateProfileDisplay(data.user);

        // Remove the notification after 2 seconds
        setTimeout(() => {
          alertDiv.remove();
        }, 2000);
      } else {
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-danger alert-dismissible fade show position-fixed";
        alertDiv.style.cssText = "top: 20px; right: 20px; z-index: 9999;";
        alertDiv.innerHTML = `
              <div><i class="fas fa-exclamation-triangle"></i> ${
                data.error || "Failed to update profile"
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
      alertDiv.style.cssText = "top: 20px; right: 20px; z-index: 9999;";
      alertDiv.innerHTML = `
            <div><i class="fas fa-exclamation-triangle"></i> Failed to update profile. Please try again.</div>
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
    '<i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i>';

  // Upload the image
  fetch("/profile/upload-picture", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
         .then((data) => {
       if (data.success) {
         // Update the profile picture with the new image
         profilePicture.innerHTML = `<img src="${data.profilePicture}" alt="Profile Picture" class="profile-image">`;
         
         // Update header avatar immediately
         const headerAvatar = document.querySelector('.user-avatar');
         if (headerAvatar) {
           headerAvatar.innerHTML = `<img src="${data.profilePicture}" alt="Profile Picture" class="profile-image">`;
         }
         
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
