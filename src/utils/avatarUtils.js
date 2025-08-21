// Utility functions for avatar handling
class AvatarUtils {
  static getGravatarUrl(email, size = 200) {
    if (!email) return null;
    const hash = CryptoJS.MD5(email.toLowerCase().trim()).toString();
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=pg`;
  }

  static getUserAvatar(user, size = 200) {
    // Check if user uses Gravatar and has email
    if (user.useGravatar && user.email) {
      return this.getGravatarUrl(user.email, size);
    }

    // If user has a profile picture, use it
    if (
      user.profilePicture &&
      (user.profilePicture.startsWith("http") ||
        user.profilePicture.startsWith("/uploads/") ||
        user.profilePicture.includes("cloudinary.com") ||
        user.profilePicture.includes("gravatar.com"))
    ) {
      return user.profilePicture;
    }

    // Fallback to initials
    return null;
  }

  static getUserInitials(user) {
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  static createAvatarElement(user, size = 200, className = "profile-image") {
    const avatarUrl = this.getUserAvatar(user, size);

    if (avatarUrl) {
      return `<img src="${avatarUrl}" alt="Profile Picture" class="${className}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    } else {
      const initials = this.getUserInitials(user);
      return `<div class="${className} initials-avatar" style="width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: ${Math.max(
        12,
        size * 0.3
      )}px;">${initials}</div>`;
    }
  }

  static createSmallAvatarElement(user, size = 40) {
    return this.createAvatarElement(user, size, "small-profile-image");
  }

  static createMediumAvatarElement(user, size = 60) {
    return this.createAvatarElement(user, size, "medium-profile-image");
  }

  static createLargeAvatarElement(user, size = 200) {
    return this.createAvatarElement(user, size, "large-profile-image");
  }
}

// Export for both CommonJS and ES modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = AvatarUtils;
} else if (typeof window !== "undefined") {
  window.AvatarUtils = AvatarUtils;
}
