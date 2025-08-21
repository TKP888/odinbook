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

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${this.getBackgroundColor(type)};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      max-width: 400px;
      animation: slideInRight 0.3s ease-out;
    `;

    // Add animation styles
    if (!document.getElementById("notification-styles")) {
      const style = document.createElement("style");
      style.id = "notification-styles";
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        .notification-close {
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          margin-left: 10px;
          padding: 0;
        }
        .notification-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentElement) {
          notification.style.animation = "slideOutRight 0.3s ease-in";
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

    spinner.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    if (!document.getElementById("spinner-styles")) {
      const style = document.createElement("style");
      style.id = "spinner-styles";
      style.textContent = `
        .loading-spinner .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .loading-spinner .spinner-message {
          margin-top: 10px;
          color: #666;
          font-size: 14px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

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

    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    if (!document.getElementById("dialog-styles")) {
      const style = document.createElement("style");
      style.id = "dialog-styles";
      style.textContent = `
        .confirm-dialog {
          background: white;
          border-radius: 8px;
          padding: 20px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .confirm-dialog h3 {
          margin-top: 0;
          color: #333;
        }
        .confirm-dialog p {
          color: #666;
          margin-bottom: 20px;
        }
        .confirm-dialog-buttons {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        .btn-secondary {
          background: #6c757d;
          color: white;
        }
        .btn-danger {
          background: #dc3545;
          color: white;
        }
      `;
      document.head.appendChild(style);
    }

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
