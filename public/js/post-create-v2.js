/**
 * Post Create V2 Component JavaScript
 * Enhanced functionality for the new post creation component
 */

class PostCreateV2 {
  constructor() {
    this.isSubmitting = false;
    this.maxLength = 250;
    this.initializeEventListeners();
    this.initializeCharacterCounter();
  }

  /**
   * Initialize all event listeners
   */
  initializeEventListeners() {
    // Character counter for textarea
    const textarea = document.getElementById("postContentV2");
    if (textarea) {
      textarea.addEventListener("input", this.handleTextareaInput.bind(this));
      textarea.addEventListener("paste", this.handlePaste.bind(this));
      textarea.addEventListener("keydown", this.handleKeydown.bind(this));
    }

    // Photo upload handling
    const photoInput = document.getElementById("postPhotoV2");
    if (photoInput) {
      photoInput.addEventListener("change", this.handlePhotoUpload.bind(this));
    }

    // Form submission
    const form = document.getElementById("createPostFormV2");
    if (form) {
      form.addEventListener("submit", this.handleFormSubmit.bind(this));
    }

    // Auto-resize textarea
    this.initializeAutoResize();
  }

  /**
   * Initialize character counter
   */
  initializeCharacterCounter() {
    const textarea = document.getElementById("postContentV2");
    const counter = document.getElementById("charCountV2");

    if (textarea && counter) {
      this.updateCharacterCounter();
    }
  }

  /**
   * Handle textarea input for character counting
   */
  handleTextareaInput(event) {
    this.updateCharacterCounter();
    this.autoResizeTextarea(event.target);
  }

  /**
   * Handle paste events to ensure character limit
   */
  handlePaste(event) {
    setTimeout(() => {
      this.updateCharacterCounter();
      this.autoResizeTextarea(event.target);
    }, 10);
  }

  /**
   * Handle keydown events for special keys
   */
  handleKeydown(event) {
    // Allow Ctrl+Enter to submit
    if (event.ctrlKey && event.key === "Enter") {
      event.preventDefault();
      this.createPostV2();
    }
  }

  /**
   * Update character counter with visual feedback
   */
  updateCharacterCounter() {
    const textarea = document.getElementById("postContentV2");
    const counter = document.getElementById("charCountV2");

    if (!textarea || !counter) return;

    const currentLength = textarea.value.length;
    const remaining = this.maxLength - currentLength;

    counter.textContent = `${currentLength}/${this.maxLength}`;

    // Update counter styling based on remaining characters
    counter.classList.remove("warning", "danger");

    if (remaining <= 0) {
      counter.classList.add("danger");
    } else if (remaining <= 50) {
      counter.classList.add("warning");
    }
  }

  /**
   * Auto-resize textarea based on content
   */
  autoResizeTextarea(textarea) {
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";

    // Set height to scrollHeight, but with min/max constraints
    const minHeight = 60; // Minimum height in pixels
    const maxHeight = 200; // Maximum height in pixels
    const newHeight = Math.max(
      minHeight,
      Math.min(maxHeight, textarea.scrollHeight)
    );

    textarea.style.height = newHeight + "px";
  }

  /**
   * Initialize auto-resize functionality
   */
  initializeAutoResize() {
    const textarea = document.getElementById("postContentV2");
    if (textarea) {
      // Set initial height
      this.autoResizeTextarea(textarea);
    }
  }

  /**
   * Handle photo upload
   */
  handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      this.showNotification("Please select a valid image file.", "error");
      event.target.value = "";
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.showNotification("Image size must be less than 5MB.", "error");
      event.target.value = "";
      return;
    }

    // Show preview
    this.showPhotoPreview(file);
  }

  /**
   * Show photo preview
   */
  showPhotoPreview(file) {
    const previewContainer = document.getElementById("photoPreviewContainer");
    const preview = document.getElementById("photoPreview");
    const filename = document.getElementById("photoFileName");

    if (!previewContainer || !preview || !filename) return;

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      filename.textContent = file.name;
      previewContainer.style.display = "flex";
    };
    reader.readAsDataURL(file);
  }

  /**
   * Remove photo
   */
  removePhotoV2(photoInputId) {
    const photoInput = document.getElementById(photoInputId);
    const previewContainer = document.getElementById("photoPreviewContainer");

    if (photoInput) {
      photoInput.value = "";
    }

    if (previewContainer) {
      previewContainer.style.display = "none";
    }
  }

  /**
   * Trigger photo upload
   */
  triggerPhotoUpload(photoInputId) {
    const photoInput = document.getElementById(photoInputId);
    if (photoInput) {
      photoInput.click();
    }
  }

  /**
   * Handle form submission
   */
  handleFormSubmit(event) {
    event.preventDefault();
    this.createPostV2();
  }

  /**
   * Create post with enhanced functionality
   */
  async createPostV2() {
    if (this.isSubmitting) return;

    const content =
      document.getElementById("postContentV2")?.value.trim() || "";
    const photoFile = document.getElementById("postPhotoV2")?.files[0];

    // Validation - require either content (min 1 char) OR an image
    if (!content && !photoFile) {
      this.showNotification(
        "Please add some content or a photo to your post.",
        "warning"
      );
      return;
    }

    if (content && content.length > this.maxLength) {
      this.showNotification(
        `Post content cannot exceed ${this.maxLength} characters.`,
        "warning"
      );
      return;
    }

    this.isSubmitting = true;
    this.showLoadingState(true);

    try {
      const formData = new FormData();
      if (content) {
        formData.append("content", content);
      }
      if (photoFile) {
        formData.append("photo", photoFile);
      }

      const response = await fetch("/posts", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        this.showNotification("Post created successfully!", "success");
        this.resetForm();
        this.refreshPosts();
      } else {
        throw new Error(data.error || "Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      this.showNotification(
        error.message || "Failed to create post. Please try again.",
        "error"
      );
    } finally {
      this.isSubmitting = false;
      this.showLoadingState(false);
    }
  }

  /**
   * Show/hide loading state
   */
  showLoadingState(show) {
    const overlay = document.getElementById("postLoadingOverlay");
    const submitBtn = document.getElementById("createPostBtnV2");

    if (overlay) {
      overlay.style.display = show ? "flex" : "none";
    }

    if (submitBtn) {
      submitBtn.disabled = show;
      if (show) {
        submitBtn.innerHTML =
          '<i class="fas fa-spinner fa-spin"></i><span class="btn-text">Posting...</span>';
      } else {
        submitBtn.innerHTML =
          '<i class="fas fa-paper-plane"></i><span class="btn-text">Post</span>';
      }
    }
  }

  /**
   * Reset form to initial state
   */
  resetForm() {
    const textarea = document.getElementById("postContentV2");
    const photoInput = document.getElementById("postPhotoV2");
    const counter = document.getElementById("charCountV2");

    if (textarea) {
      textarea.value = "";
      this.autoResizeTextarea(textarea);
    }

    if (photoInput) {
      photoInput.value = "";
    }

    if (counter) {
      counter.textContent = "0/250";
      counter.classList.remove("warning", "danger");
    }

    this.removePhotoV2("postPhotoV2");
  }

  /**
   * Refresh posts feed
   */
  refreshPosts() {
    // Try to refresh using existing post manager if available
    if (
      typeof window.postManager !== "undefined" &&
      window.postManager.loadPosts
    ) {
      window.postManager.loadPosts(true);
    } else if (typeof window.loadPosts === "function") {
      window.loadPosts(true);
    } else {
      // Fallback: reload the page
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = "info") {
    // Try to use existing notification system
    if (typeof window.showNotification === "function") {
      window.showNotification(message, type);
    } else if (
      typeof window.NotificationUtils !== "undefined" &&
      window.NotificationUtils.showSuccess
    ) {
      switch (type) {
        case "success":
          window.NotificationUtils.showSuccess(message);
          break;
        case "error":
          window.NotificationUtils.showError(message);
          break;
        case "warning":
          window.NotificationUtils.showWarning(message);
          break;
        default:
          window.NotificationUtils.showInfo(message);
      }
    } else {
      // Fallback: use browser alert
      alert(message);
    }
  }
}

// Global functions for backward compatibility
function createPostV2() {
  if (window.postCreateV2Instance) {
    window.postCreateV2Instance.createPostV2();
  }
}

function triggerPhotoUpload(photoInputId) {
  if (window.postCreateV2Instance) {
    window.postCreateV2Instance.triggerPhotoUpload(photoInputId);
  }
}

function removePhotoV2(photoInputId) {
  if (window.postCreateV2Instance) {
    window.postCreateV2Instance.removePhotoV2(photoInputId);
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  // Only initialize if the V2 component exists
  if (document.getElementById("postContentV2")) {
    window.postCreateV2Instance = new PostCreateV2();
  }
});

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = PostCreateV2;
}
