// Extracted from views/layouts/main.ejs (header search and friend request logic)

// Header Search Script
let headerSearchTimeout;

function headerSearchUsers() {
  const searchTerm = document
    .getElementById("headerSearchInput")
    .value.trim();

  if (searchTerm.length === 0) {
    hideHeaderSearchResults();
    return;
  }

  showHeaderSearchLoading();

  const searchUrl = `/friends/search?q=${encodeURIComponent(searchTerm)}`;

  fetch(searchUrl)
    .then((response) => response.json())
    .then((data) => {
      hideHeaderSearchLoading();
      displayHeaderSearchResults(data.users);
    })
    .catch((error) => {
      hideHeaderSearchLoading();
      hideHeaderSearchResults();
    });
}

function displayHeaderSearchResults(users) {
  const resultsDiv = document.getElementById("headerSearchResults");
  const usersListDiv = document.getElementById("headerUsersList");
  const noResultsDiv = document.getElementById("headerNoResults");

  if (users.length === 0) {
    resultsDiv.classList.remove("d-none");
    usersListDiv.innerHTML = "";
    noResultsDiv.classList.remove("d-none");
    return;
  }

  noResultsDiv.classList.add("d-none");
  resultsDiv.classList.remove("d-none");

  usersListDiv.innerHTML = users
    .map(
      (user) => `
        <div class="search-result-item">
          <div class="d-flex align-items-center p-2">
            <div class="user-avatar-small me-3">
              ${(user.firstName || "").charAt(0)}${(user.lastName || "").charAt(0)}
            </div>
            <div class="flex-grow-1">
              <div class="fw-bold">${user.firstName || ""} ${user.lastName || ""}</div>
              <div class="text-muted small">@${user.username}</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="sendFriendRequestFromHeader('${user.id}', '${user.firstName || ""} ${user.lastName || ""}')">
              <i class="fas fa-user-plus"></i>
            </button>
          </div>
        </div>
      `
    )
    .join("");
}

function sendFriendRequestFromHeader(userId, userName = "") {
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
        alertDiv.style.cssText =
          "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
        alertDiv.innerHTML = `
                <i class="fas fa-user-plus"></i> Friend request sent to ${userName || "user"}!
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
              `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 3000);

        // Hide search results
        hideHeaderSearchResults();
        // Clear search input
        document.getElementById("headerSearchInput").value = "";
      } else {
        if (
          data.error ===
          "You already have a pending request from this user"
        ) {
          // Show a more helpful message
          const alertDiv = document.createElement("div");
          alertDiv.className =
            "alert alert-info alert-dismissible fade show position-fixed";
          alertDiv.style.cssText =
            "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
          alertDiv.innerHTML = `
                  <i class="fas fa-info-circle"></i> ${data.error}
                  <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                `;
          document.body.appendChild(alertDiv);
          setTimeout(() => alertDiv.remove(), 5000);
        } else {
          alert(data.error || "Could not send request");
        }
      }
    })
    .catch(() => {
      alert("Could not send request. Please try again.");
    });
}

function showHeaderSearchLoading() {
  document.getElementById("headerSearchLoading").classList.remove("d-none");
  document.getElementById("headerSearchResults").classList.remove("d-none");
  document.getElementById("headerUsersList").innerHTML = "";
  document.getElementById("headerNoResults").classList.add("d-none");
}

function hideHeaderSearchLoading() {
  document.getElementById("headerSearchLoading").classList.add("d-none");
}

function hideHeaderSearchResults() {
  document.getElementById("headerSearchResults").classList.add("d-none");
}

// Add event listeners for header search
document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("headerSearchInput");

  // Real-time search with debouncing
  searchInput.addEventListener("input", function () {
    clearTimeout(headerSearchTimeout);
    const searchTerm = this.value.trim();

    if (searchTerm.length === 0) {
      hideHeaderSearchResults();
      return;
    }

    headerSearchTimeout = setTimeout(() => {
      headerSearchUsers();
    }, 300);
  });

  // Search on Enter key
  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      headerSearchUsers();
    }
  });

  // Hide search results when clicking outside
  document.addEventListener("click", function (e) {
    const searchContainer = document.querySelector(".search-container");
    const searchResults = document.getElementById("headerSearchResults");

    if (!searchContainer.contains(e.target)) {
      hideHeaderSearchResults();
    }
  });
});

// Update header friend request count badge and dropdown content
function updateHeaderRequestCount() {
  fetch("/friends/requests")
    .then((response) => response.json())
    .then((data) => {
      const countBadge = document.getElementById("headerRequestCount");
      const requestsList = document.getElementById("headerRequestsList");

      if (countBadge) {
        if (data.requests.length > 0) {
          countBadge.textContent = data.requests.length;
              countBadge.classList.remove("d-none");
  } else {
    countBadge.classList.add("d-none");
  }
      }

      if (requestsList) {
        if (data.requests.length === 0) {
          requestsList.innerHTML = `
                <div class="text-center text-muted p-3">
                  <i class="fas fa-inbox fa-2x mb-2"></i>
                  <p class="mb-0 small">No pending requests</p>
                </div>
              `;
        } else {
          requestsList.innerHTML = data.requests
            .map(
              (request) => `
                <div class="dropdown-item p-2">
                  <div class="d-flex align-items-center">
                    <div class="user-avatar-small me-2" style="width: 32px; height: 32px; font-size: 0.9rem;">
                      ${(request.sender.firstName || "").charAt(0)}${(
                        request.sender.lastName || ""
                      ).charAt(0)}
                    </div>
                    <div class="flex-grow-1">
                      <div class="fw-bold small">${
                        request.sender.firstName || ""
                      } ${request.sender.lastName || ""}</div>
                      <div class="text-muted small">@${
                        request.sender.username
                      }</div>
                    </div>
                    <div class="btn-group btn-group-sm" role="group">
                      <button class="btn btn-success btn-sm" onclick="acceptRequest('${
                        request.id
                      }')" title="Accept">
                        <i class="fas fa-check"></i>
                      </button>
                      <button class="btn btn-outline-secondary btn-sm" onclick="declineRequest('${
                        request.id
                      }')" title="Decline">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>
              `
            )
            .join("");
        }
      }
    })
    .catch((error) => {
      console.error("Error updating header request count:", error);
    });
}

function acceptRequest(requestId) {
  fetch("/friends/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        updateHeaderRequestCount();
        // Refresh friends list on dashboard if we're on the dashboard page
        if (typeof refreshFriendsList === "function") {
          refreshFriendsList();
        }
        // Show success message
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-success alert-dismissible fade show position-fixed";
        alertDiv.style.cssText =
          "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
        alertDiv.innerHTML = `
              <i class="fas fa-check"></i> Friend request accepted!
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 3000);
      } else {
        alert(data.error || "Could not accept request");
      }
    })
    .catch(() => {
      alert("Could not accept request. Please try again.");
    });
}

function declineRequest(requestId) {
  fetch("/friends/decline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        updateHeaderRequestCount();
        // Show success message
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-info alert-dismissible fade show position-fixed";
        alertDiv.style.cssText =
          "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
        alertDiv.innerHTML = `
              <i class="fas fa-times"></i> Friend request declined
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 3000);
      } else {
        alert(data.error || "Could not decline request");
      }
    })
    .catch(() => {
      alert("Could not decline request. Please try again.
");
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

document.addEventListener("DOMContentLoaded", function () {
  updateHeaderRequestCount();
  // Update every 30 seconds for live updates
  setInterval(updateHeaderRequestCount, 30000);
});