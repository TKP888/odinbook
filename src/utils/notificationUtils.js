// Utility functions for notifications and user feedback
class NotificationUtils {
  static showNotification(message, type = "info", duration = 3000) {
    // Remove existing notifications
    this.removeExistingNotifications();

    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentElement) {
          notification.classList.add("notification-slide-out");
          setTimeout(() => notification.remove(), 300);
        }
      }, duration);
    }

    return notification;
  }

  static showSuccess(message, duration = 3000) {
    return this.showNotification(message, "success", duration);
  }

  static showError(message, duration = 5000) {
    return this.showNotification(message, "error", duration);
  }

  static showWarning(message, duration = 4000) {
    return this.showNotification(message, "warning", duration);
  }

  static showInfo(message, duration = 3000) {
    return this.showNotification(message, "info", duration);
  }

  static removeExistingNotifications() {
    const existingNotifications = document.querySelectorAll(".notification");
    existingNotifications.forEach((notification) => notification.remove());
  }

  static getBackgroundColor(type) {
    const colors = {
      success: "#28a745",
      error: "#dc3545",
      warning: "#ffc107",
      info: "#17a2b8",
    };
    return colors[type] || colors.info;
  }

  static showLoadingSpinner(container, message = "Loading...") {
    const spinner = document.createElement("div");
    spinner.className = "loading-spinner";
    spinner.innerHTML = `
      <div class="spinner"></div>
      <div class="spinner-message">${message}</div>
    `;

    container.appendChild(spinner);
    return spinner;
  }

  static hideLoadingSpinner(spinner) {
    if (spinner && spinner.parentElement) {
      spinner.remove();
    }
  }

  static showConfirmDialog(message, onConfirm, onCancel) {
    const dialog = document.createElement("div");
    dialog.className = "confirm-dialog-overlay";
    dialog.innerHTML = `
      <div class="confirm-dialog">
        <div class="confirm-dialog-content">
          <h3>Confirm Action</h3>
          <p>${message}</p>
          <div class="confirm-dialog-buttons">
            <button class="btn btn-secondary cancel-btn">Cancel</button>
            <button class="btn btn-danger confirm-btn">Confirm</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // Event listeners
    dialog.querySelector(".confirm-btn").addEventListener("click", () => {
      dialog.remove();
      if (onConfirm) onConfirm();
    });

    dialog.querySelector(".cancel-btn").addEventListener("click", () => {
      dialog.remove();
      if (onCancel) onCancel();
    });

    // Close on overlay click
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        dialog.remove();
        if (onCancel) onCancel();
      }
    });

    return dialog;
  }
}

// Export for both CommonJS and ES modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = NotificationUtils;
} else if (typeof window !== "undefined") {
  window.NotificationUtils = NotificationUtils;
}
