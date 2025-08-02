// Extracted from views/profile/index.ejs (profile logic)

// Initialize modals
let createPostModal;
let editPostModal;
let likesModal;

document.addEventListener("DOMContentLoaded", function () {
  createPostModal = new bootstrap.Modal(
    document.getElementById("createPostModal")
  );
  editPostModal = new bootstrap.Modal(document.getElementById("editPostModal"));
  likesModal = new bootstrap.Modal(document.getElementById("likesModal"));

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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        createPostModal.hide();
        location.reload(); // Refresh the page to show new post
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

function editPost(postId, content) {
  document.getElementById("editPostId").value = postId;
  document.getElementById("editPostContent").value = content;
  document.getElementById("editCharCount").textContent = content.length;
  editPostModal.show();
}

function saveEditedPost() {
  const postId = document.getElementById("editPostId").value;
  const content = document.getElementById("editPostContent").value.trim();

  if (!content) {
    alert("Please enter some content for your post.");
    return;
  }

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
        location.reload(); // Refresh the page to show updated post
      } else {
        alert(data.error || "Failed to update post");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Failed to update post. Please try again.");
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
          location.reload(); // Refresh the page to remove the post
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

function toggleLike(postId) {
  fetch(`/posts/${postId}/like`, {
    method: "POST",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        location.reload(); // Refresh to update like status
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
  const commentsSection = document.getElementById(`comments-${postId}`);
  if (commentsSection.classList.contains("d-none")) {
    commentsSection.classList.remove("d-none");
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
  const input = document.getElementById(`comment-input-${postId}`);
  const content = input.value.trim();

  if (!content) return;

  fetch(`/posts/${postId}/comment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        location.reload(); // Refresh to show new comment
      } else {
        alert(data.error || "Failed to add comment");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Failed to add comment. Please try again.");
    });
}

function deleteComment(commentId) {
  if (confirm("Are you sure you want to delete this comment?")) {
    fetch(`/comments/${commentId}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          location.reload(); // Refresh to remove the comment
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

function showLikes(postId) {
  fetch(`/posts/${postId}/likes`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const likesList = document.getElementById("likesList");
        likesList.innerHTML = data.likes
          .map(
            (like) => `
        <div class="d-flex align-items-center mb-2">
          <div class="user-avatar-large me-2" style="width: 30px; height: 30px; font-size: 0.8rem;">
            ${(like.user.firstName || "").charAt(0)}${(
              like.user.lastName || ""
            ).charAt(0)}
          </div>
          <div>
            <small class="fw-bold">${like.user.firstName || ""} ${
              like.user.lastName || ""
            }</small>
            <br>
            <small class="text-muted">@${like.user.username}</small>
          </div>
        </div>
      `
          )
          .join("");
        likesModal.show();
      } else {
        alert(data.error || "Failed to load likes");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Failed to load likes. Please try again.");
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
          location.reload(); // Refresh the page to update the friends list
        } else {
          alert(data.error || "Failed to remove friend");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Failed to remove friend. Please try again.");
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
    alert("Bio cannot exceed 500 characters.");
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
      } else {
        alert(data.error || "Failed to save bio");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Failed to save bio. Please try again.");
    })
    .finally(() => {
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = false;
    });
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        document.getElementById("inlinePostContent").value = "";
        document.getElementById("inlineCharCount").textContent = "0";
        location.reload(); // Refresh the page to show new post
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
