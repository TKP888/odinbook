// Post Manager Module
class PostManager {
  constructor() {
    this.currentPage = 1;
    this.hasNextPage = true;
    this.isLoading = false;
    this.postsContainer = document.getElementById("postsContainer");
    this.loadMoreBtn = document.getElementById("loadMoreBtn");
    this.createPostModal = null;
    this.editPostModal = null;

    this.initializeModals();
    this.bindEvents();
  }

  initializeModals() {
    // Initialize modals
    this.createPostModal = new bootstrap.Modal(
      document.getElementById("createPostModal")
    );
    this.editPostModal = new bootstrap.Modal(
      document.getElementById("editPostModal")
    );

    // Character count for create post textarea
    const postContent = document.getElementById("postContent");
    if (postContent) {
      postContent.addEventListener("input", (e) =>
        this.handleCharacterCount(e, "charCount")
      );
    }

    // Character count for edit post textarea
    const editPostContent = document.getElementById("editPostContent");
    if (editPostContent) {
      editPostContent.addEventListener("input", (e) =>
        this.handleCharacterCount(e, "editCharCount")
      );
    }
  }

  bindEvents() {
    // Load more posts
    if (this.loadMoreBtn) {
      this.loadMoreBtn.addEventListener("click", () => this.loadMorePosts());
    }

    // Create post form
    const createPostForm = document.getElementById("createPostForm");
    if (createPostForm) {
      createPostForm.addEventListener("submit", (e) =>
        this.handleCreatePost(e)
      );
    }

    // Edit post form
    const editPostForm = document.getElementById("editPostForm");
    if (editPostForm) {
      editPostForm.addEventListener("submit", (e) => this.handleEditPost(e));
    }

    // Photo selection
    this.handlePhotoSelection();
  }

  handleCharacterCount(event, counterId) {
    const text = event.target.value;
    const charCount = text.length;
    const charCountElement = document.getElementById(counterId);

    if (charCountElement) {
      charCountElement.textContent = charCount;

      // Update character count color
      if (charCount > 900) {
        charCountElement.style.color = "#dc3545";
      } else if (charCount > 800) {
        charCountElement.style.color = "#ffc107";
      } else {
        charCountElement.style.color = "#6c757d";
      }
    }
  }

  async loadPosts(forceRefresh = false) {
    if (this.isLoading) return;

    try {
      this.isLoading = true;

      if (forceRefresh) {
        this.currentPage = 1;
        this.hasNextPage = true;
      }

      const response = await fetch(`/posts?page=${this.currentPage}&limit=10`);
      const data = await response.json();

      if (response.ok) {
        if (forceRefresh) {
          this.postsContainer.innerHTML = "";
        }

        this.renderPosts(data.posts);
        this.hasNextPage = data.pagination.hasNextPage;
        this.updateLoadMoreButton();
      } else {
        throw new Error(data.error || "Failed to load posts");
      }
    } catch (error) {
      console.error("Error loading posts:", error);
      NotificationUtils.showError("Failed to load posts");
    } finally {
      this.isLoading = false;
    }
  }

  async loadMorePosts() {
    if (this.isLoading || !this.hasNextPage) return;

    this.currentPage++;
    await this.loadPosts();
  }

  renderPosts(posts) {
    posts.forEach((post) => {
      const postElement = this.createPostElement(post);
      this.postsContainer.appendChild(postElement);
    });
  }

  createPostElement(post) {
    const postDiv = document.createElement("div");
    postDiv.className = "post";
    postDiv.dataset.postId = post.id;

    const isLiked = post.likes.some((like) => like.userId === currentUserId);
    const likeButtonClass = isLiked
      ? "btn btn-danger btn-sm"
      : "btn btn-outline-danger btn-sm";
    const likeButtonText = isLiked ? "Unlike" : "Like";

    postDiv.innerHTML = `
      <div class="post-header">
        <div class="post-user-info">
          ${AvatarUtils.createSmallAvatarElement(post.user, 40)}
          <div class="post-user-details">
            <strong>${post.user.firstName} ${post.user.lastName}</strong>
            <small class="text-muted">@${post.user.username}</small>
            <small class="text-muted">${new Date(
              post.createdAt
            ).toLocaleDateString()}</small>
          </div>
        </div>
        ${
          post.userId === currentUserId
            ? `
          <div class="post-actions">
            <button class="btn btn-sm btn-outline-secondary edit-post-btn" onclick="postManager.editPost('${post.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger delete-post-btn" onclick="postManager.deletePost('${post.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        `
            : ""
        }
      </div>
      <div class="post-content">
        <p>${post.content}</p>
        ${
          post.photoUrl
            ? `<img src="${post.photoUrl}" alt="Post photo" class="post-photo">`
            : ""
        }
      </div>
      <div class="post-actions-bar">
        <button class="${likeButtonClass} like-btn post-action-btn" onclick="postManager.toggleLike('${
      post.id
    }')" title="${likeButtonText}">
          <i class="fas fa-heart"></i>
          <span class="like-count">${post.likes.length}</span>
        </button>
        <button class="btn btn-outline-secondary btn-sm comment-btn post-action-btn" onclick="postManager.toggleComments('${
          post.id
        }')" title="Comment">
          <i class="fas fa-comment"></i>
          <span class="comment-count">${post.comments.length}</span>
        </button>
      </div>
      <div class="comments-section" id="comments-${
        post.id
      }" style="display: none;">
        <div class="comments-list" id="commentsList-${post.id}">
          ${this.renderComments(post.comments)}
        </div>
        <div class="add-comment">
          <textarea class="form-control comment-input" placeholder="Write a comment..." rows="2"></textarea>
          <button class="btn btn-primary btn-sm mt-2" onclick="postManager.addComment('${
            post.id
          }')">
            Add Comment
          </button>
        </div>
      </div>
    `;

    return postDiv;
  }

  renderComments(comments) {
    if (!comments || comments.length === 0) {
      return '<p class="text-muted">No comments yet.</p>';
    }

    return comments
      .map(
        (comment) => `
      <div class="comment" data-comment-id="${comment.id}">
        <div class="comment-header">
          ${AvatarUtils.createSmallAvatarElement(comment.user, 30)}
          <div class="comment-user-details">
            <strong>${comment.user.firstName} ${comment.user.lastName}</strong>
            <small class="text-muted">@${comment.user.username}</small>
            <small class="text-muted">${new Date(
              comment.createdAt
            ).toLocaleDateString()}</small>
          </div>
          ${
            comment.userId === currentUserId
              ? `
            <button class="btn btn-sm btn-outline-danger delete-comment-btn" onclick="postManager.deleteComment('${comment.id}')">
              <i class="fas fa-trash"></i>
            </button>
          `
              : ""
          }
        </div>
        <div class="comment-content">
          <p>${comment.content}</p>
        </div>
      </div>
    `
      )
      .join("");
  }

  updateLoadMoreButton() {
    if (this.loadMoreBtn) {
      this.loadMoreBtn.style.display = this.hasNextPage ? "block" : "none";
    }
  }

  async handleCreatePost(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const content = formData.get("content");
    const photo = formData.get("photo");

    if (!content.trim()) {
      NotificationUtils.showError("Post content is required");
      return;
    }

    try {
      const response = await fetch("/posts", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        this.createPostModal.hide();
        event.target.reset();
        document.getElementById("charCount").textContent = "0";
        this.loadPosts(true);
        NotificationUtils.showSuccess("Post created successfully!");
      } else {
        throw new Error(data.error || "Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      NotificationUtils.showError(error.message || "Failed to create post");
    }
  }

  async handleEditPost(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const content = formData.get("content");
    const postId = event.target.dataset.postId;

    if (!content.trim()) {
      NotificationUtils.showError("Post content is required");
      return;
    }

    try {
      const response = await fetch(`/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (response.ok) {
        this.editPostModal.hide();
        this.loadPosts(true);
        NotificationUtils.showSuccess("Post updated successfully!");
      } else {
        throw new Error(data.error || "Failed to update post");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      NotificationUtils.showError(error.message || "Failed to update post");
    }
  }

  editPost(postId) {
    // Find the post and populate the edit form
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    if (!postElement) return;

    const content = postElement.querySelector(".post-content p").textContent;
    const editForm = document.getElementById("editPostForm");
    const editContent = document.getElementById("editPostContent");

    editForm.dataset.postId = postId;
    editContent.value = content;
    document.getElementById("editCharCount").textContent = content.length;

    this.editPostModal.show();
  }

  async deletePost(postId) {
    const confirmDelete = () => {
      this.performDeletePost(postId);
    };

    NotificationUtils.showConfirmDialog(
      "Are you sure you want to delete this post? This action cannot be undone.",
      confirmDelete
    );
  }

  async performDeletePost(postId) {
    try {
      const response = await fetch(`/posts/${postId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const postElement = document.querySelector(
          `[data-post-id="${postId}"]`
        );
        if (postElement) {
          postElement.remove();
        }
        NotificationUtils.showSuccess("Post deleted successfully!");
      } else {
        throw new Error("Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      NotificationUtils.showError("Failed to delete post");
    }
  }

  async toggleLike(postId) {
    try {
      const response = await fetch(`/posts/${postId}/like`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        const postElement = document.querySelector(
          `[data-post-id="${postId}"]`
        );
        const likeBtn = postElement.querySelector(".like-btn");
        const likeCount = postElement
          .querySelector(".like-btn i")
          .nextSibling.textContent.match(/\d+/)[0];

        if (data.liked) {
          likeBtn.className = "btn btn-danger btn-sm like-btn";
          likeBtn.innerHTML = `<i class="fas fa-heart"></i> Unlike (${
            parseInt(likeCount) + 1
          })`;
        } else {
          likeBtn.className = "btn btn-outline-danger btn-sm like-btn";
          likeBtn.innerHTML = `<i class="fas fa-heart"></i> Like (${
            parseInt(likeCount) - 1
          })`;
        }
      } else {
        throw new Error(data.error || "Failed to toggle like");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      NotificationUtils.showError("Failed to toggle like");
    }
  }

  toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    if (commentsSection) {
      commentsSection.style.display =
        commentsSection.style.display === "none" ? "block" : "none";
    }
  }

  async addComment(postId) {
    const commentInput = document.querySelector(
      `#comments-${postId} .comment-input`
    );
    const content = commentInput.value.trim();

    if (!content) {
      NotificationUtils.showError("Comment content is required");
      return;
    }

    try {
      const response = await fetch(`/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (response.ok) {
        commentInput.value = "";
        this.loadPosts(true);
        NotificationUtils.showSuccess("Comment added successfully!");
      } else {
        throw new Error(data.error || "Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      NotificationUtils.showError(error.message || "Failed to add comment");
    }
  }

  async deleteComment(commentId) {
    const confirmDelete = () => {
      this.performDeleteComment(commentId);
    };

    NotificationUtils.showConfirmDialog(
      "Are you sure you want to delete this comment?",
      confirmDelete
    );
  }

  async performDeleteComment(commentId) {
    try {
      const response = await fetch(`/comments/${commentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const commentElement = document.querySelector(
          `[data-comment-id="${commentId}"]`
        );
        if (commentElement) {
          commentElement.remove();
        }
        NotificationUtils.showSuccess("Comment deleted successfully!");
      } else {
        throw new Error("Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      NotificationUtils.showError("Failed to delete comment");
    }
  }

  handlePhotoSelection() {
    const photoInput = document.getElementById("postPhoto");
    const photoPreview = document.getElementById("photoPreview");

    if (photoInput && photoPreview) {
      photoInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            photoPreview.src = e.target.result;
            photoPreview.style.display = "block";
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  refreshPosts() {
    this.loadPosts(true);
  }
}

// Export for both CommonJS and ES modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = PostManager;
} else if (typeof window !== "undefined") {
  window.PostManager = PostManager;
}
