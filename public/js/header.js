// Extracted from views/layouts/main.ejs (header search and friend request logic)

// Header Search Script
let headerSearchTimeout;

function headerSearchUsers() {
  const searchTerm = document.getElementById("headerSearchInput").value.trim();

  console.log("Searching for:", searchTerm);

  if (searchTerm.length === 0) {
    hideHeaderSearchResults();
    return;
  }

  showHeaderSearchLoading();

  const searchUrl = `/friends/search?q=${encodeURIComponent(searchTerm)}`;
  console.log("Search URL:", searchUrl);

  fetch(searchUrl)
    .then((response) => {
      console.log("Search response status:", response.status);
      return response.json();
    })
    .then((data) => {
      console.log("Search results:", data);
      hideHeaderSearchLoading();
      displayHeaderSearchResults(data.users);
    })
    .catch((error) => {
      console.error("Search error:", error);
      hideHeaderSearchLoading();
      hideHeaderSearchResults();
    });
}

function displayHeaderSearchResults(users) {
  console.log("Displaying search results for users:", users);

  const resultsDiv = document.getElementById("headerSearchResults");
  const usersListDiv = document.getElementById("headerUsersList");
  const noResultsDiv = document.getElementById("headerNoResults");

  if (users.length === 0) {
    console.log("No users found, showing no results message");
    resultsDiv.classList.remove("d-none");
    usersListDiv.innerHTML = "";
    noResultsDiv.classList.remove("d-none");
    return;
  }

  console.log(`Found ${users.length} users, displaying results`);
  noResultsDiv.classList.add("d-none");
  resultsDiv.classList.remove("d-none");

  usersListDiv.innerHTML = users
    .map(
      (user) => `
        <div class="search-result-item">
          <div class="d-flex align-items-center p-2">
            <div class="user-avatar-small me-3">
              ${(user.firstName || "").charAt(0)}${(user.lastName || "").charAt(
        0
      )}
            </div>
            <div class="flex-grow-1">
              <div class="fw-bold">
                <a href="/profile/${
                  user.id
                }" class="text-decoration-none text-dark user-profile-link">
                  ${user.firstName || ""} ${user.lastName || ""}
                </a>
              </div>
              <div class="text-muted small">@${user.username}</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="sendFriendRequestFromHeader('${
              user.id
            }', '${user.firstName || ""} ${user.lastName || ""}')">
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
        alertDiv.innerHTML = `
                <div><i class="fas fa-user-plus"></i> Friend request sent to ${
                  userName || "user"
                }!</div>
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
          data.error === "You already have a pending request from this user"
        ) {
          // Show a more helpful message
          const alertDiv = document.createElement("div");
          alertDiv.className =
            "alert alert-info alert-dismissible fade show position-fixed";
          alertDiv.innerHTML = `
                  <div><i class="fas fa-info-circle"></i> ${data.error}</div>
                  <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                `;
          document.body.appendChild(alertDiv);
          setTimeout(() => alertDiv.remove(), 5000);
        } else {
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
      }
    })
    .catch(() => {
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
  console.log("[HEADER] Updating friend request count...");
  fetch("/friends/requests")
    .then((response) => response.json())
    .then((data) => {
      console.log("[HEADER] Received friend request data:", data);
      const countBadge = document.getElementById("headerRequestCount");
      const requestsList = document.getElementById("headerRequestsList");

      if (countBadge) {
        if (data.requests.length > 0) {
          countBadge.textContent = data.requests.length;
          countBadge.classList.remove("d-none");
          console.log(
            "[HEADER] Updated request count badge:",
            data.requests.length
          );
        } else {
          countBadge.classList.add("d-none");
          console.log("[HEADER] Hidden request count badge");
        }
      } else {
        console.warn("[HEADER] Count badge element not found");
      }

      if (requestsList) {
        if (data.requests.length === 0) {
          requestsList.innerHTML = `
                <div class="dropdown-item text-center text-muted p-3">
                  <i class="fas fa-inbox fa-2x mb-2"></i>
                  <p class="mb-0 small">No pending requests</p>
                </div>
              `;
          console.log("[HEADER] Set empty requests list");
        } else {
          requestsList.innerHTML = data.requests
            .map(
              (request) => `
                <div class="dropdown-item p-3" data-request-id="${request.id}">
                  <div class="d-flex align-items-center">
                    <div class="user-avatar-small me-3" style="width: 32px; height: 32px; font-size: 0.9rem;">
                      ${(request.sender.firstName || "").charAt(0)}${(
                request.sender.lastName || ""
              ).charAt(0)}
                    </div>
                    <div class="flex-grow-1 me-3">
                      <div class="fw-bold small mb-1">${
                        request.sender.firstName || ""
                      } ${request.sender.lastName || ""}</div>
                      <div class="text-muted small">@${
                        request.sender.username
                      }</div>
                    </div>
                    <div class="btn-group btn-group-sm" role="group">
                      <button class="btn btn-success btn-sm accept-request-btn" data-request-id="${
                        request.id
                      }" title="Accept">
                        <i class="fas fa-check"></i>
                      </button>
                      <button class="btn btn-outline-secondary btn-sm decline-request-btn" data-request-id="${
                        request.id
                      }" title="Decline">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>
              `
            )
            .join("");
          console.log(
            "[HEADER] Populated requests list with",
            data.requests.length,
            "requests"
          );
        }
      } else {
        console.warn("[HEADER] Requests list element not found");
      }
    })
    .catch((error) => {
      console.error("Error updating header request count:", error);
    });
}

function acceptRequest(requestId) {
  console.log("[HEADER] Accepting friend request:", requestId);

  // Show loading state
  const requestElement = document.querySelector(
    `[data-request-id="${requestId}"]`
  );
  const acceptBtn = requestElement?.querySelector(".accept-request-btn");
  const declineBtn = requestElement?.querySelector(".decline-request-btn");

  if (acceptBtn) {
    acceptBtn.disabled = true;
    acceptBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }
  if (declineBtn) {
    declineBtn.disabled = true;
  }

  fetch("/friends/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        console.log("[HEADER] Friend request accepted successfully");
        updateHeaderRequestCount();
        // Refresh friends list on dashboard if we're on the dashboard page
        if (typeof refreshFriendsList === "function") {
          refreshFriendsList();
        }
        // Show success message
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-success alert-dismissible fade show position-fixed";
        alertDiv.innerHTML = `
              <div><i class="fas fa-check"></i> Friend request accepted!</div>
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 3000);

        // Remove the request from the header dropdown
        if (requestElement) {
          requestElement.remove();
        }

        // Check if there are any requests left
        const remainingRequests = document.querySelectorAll(
          "#headerRequestsList .dropdown-item"
        );
        if (remainingRequests.length === 0) {
          const requestsList = document.getElementById("headerRequestsList");
          if (requestsList) {
            requestsList.innerHTML = `
                <div class="dropdown-item text-center text-muted p-3">
                  <i class="fas fa-inbox fa-2x mb-2"></i>
                  <p class="mb-0 small">No pending requests</p>
                </div>
              `;
          }
        }
      } else {
        console.error("[HEADER] Failed to accept friend request:", data.error);
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-danger alert-dismissible fade show position-fixed";
        alertDiv.innerHTML = `
              <div><i class="fas fa-exclamation-triangle"></i> ${
                data.error || "Could not accept request"
              }</div>
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);

        // Reset buttons
        if (acceptBtn) {
          acceptBtn.disabled = false;
          acceptBtn.innerHTML = '<i class="fas fa-check"></i>';
        }
        if (declineBtn) {
          declineBtn.disabled = false;
        }
      }
    })
    .catch((error) => {
      console.error("[HEADER] Error accepting friend request:", error);
      const alertDiv = document.createElement("div");
      alertDiv.className =
        "alert alert-danger alert-dismissible fade show position-fixed";
      alertDiv.innerHTML = `
            <div><i class="fas fa-exclamation-triangle"></i> An error occurred while accepting the request</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          `;
      document.body.appendChild(alertDiv);
      setTimeout(() => alertDiv.remove(), 5000);

      // Reset buttons
      if (acceptBtn) {
        acceptBtn.disabled = false;
        acceptBtn.innerHTML = '<i class="fas fa-check"></i>';
      }
      if (declineBtn) {
        declineBtn.disabled = false;
      }
    });
}

function declineRequest(requestId) {
  console.log("[HEADER] Declining friend request:", requestId);

  // Show loading state
  const requestElement = document.querySelector(
    `[data-request-id="${requestId}"]`
  );
  const acceptBtn = requestElement?.querySelector(".accept-request-btn");
  const declineBtn = requestElement?.querySelector(".decline-request-btn");

  if (declineBtn) {
    declineBtn.disabled = true;
    declineBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }
  if (acceptBtn) {
    acceptBtn.disabled = true;
  }

  fetch("/friends/decline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        console.log("[HEADER] Friend request declined successfully");
        updateHeaderRequestCount();
        // Show success message
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-info alert-dismissible fade show position-fixed";
        alertDiv.innerHTML = `
              <div><i class="fas fa-times"></i> Friend request declined</div>
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 3000);

        // Remove the request from the header dropdown
        if (requestElement) {
          requestElement.remove();
        }

        // Check if there are any requests left
        const remainingRequests = document.querySelectorAll(
          "#headerRequestsList .dropdown-item"
        );
        if (remainingRequests.length === 0) {
          const requestsList = document.getElementById("headerRequestsList");
          if (requestsList) {
            requestsList.innerHTML = `
                <div class="dropdown-item text-center text-muted p-3">
                  <i class="fas fa-inbox fa-2x mb-2"></i>
                  <p class="mb-0 small">No pending requests</p>
                </div>
              `;
          }
        }
      } else {
        console.error("[HEADER] Failed to decline friend request:", data.error);
        const alertDiv = document.createElement("div");
        alertDiv.className =
          "alert alert-danger alert-dismissible fade show position-fixed";
        alertDiv.innerHTML = `
              <div><i class="fas fa-exclamation-triangle"></i> ${
                data.error || "Could not decline request"
              }</div>
              <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);

        // Reset buttons
        if (acceptBtn) {
          acceptBtn.disabled = false;
        }
        if (declineBtn) {
          declineBtn.disabled = false;
          declineBtn.innerHTML = '<i class="fas fa-times"></i>';
        }
      }
    })
    .catch((error) => {
      console.error("[HEADER] Error declining friend request:", error);
      const alertDiv = document.createElement("div");
      alertDiv.className =
        "alert alert-danger alert-dismissible fade show position-fixed";
      alertDiv.innerHTML = `
            <div><i class="fas fa-exclamation-triangle"></i> An error occurred while declining the request</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          `;
      document.body.appendChild(alertDiv);
      setTimeout(() => alertDiv.remove(), 5000);

      // Reset buttons
      if (acceptBtn) {
        acceptBtn.disabled = false;
      }
      if (declineBtn) {
        declineBtn.disabled = false;
        declineBtn.innerHTML = '<i class="fas fa-times"></i>';
      }
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

function sendFriendRequest(userId, userName = "") {
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
        window.location.reload();
      } else {
        if (
          data.error === "You already have a pending request from this user"
        ) {
          // Show a more helpful message
          const alertDiv = document.createElement("div");
          alertDiv.className =
            "alert alert-info alert-dismissible fade show position-fixed";
          alertDiv.innerHTML = `
                  <div><i class="fas fa-info-circle"></i> ${data.error}</div>
                  <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                `;
          document.body.appendChild(alertDiv);
          setTimeout(() => alertDiv.remove(), 5000);
        } else {
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
      }
    })
    .catch(() => {
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

// Add event listeners for friend request actions
document.addEventListener("DOMContentLoaded", function () {
  // Event delegation for accept/decline friend request buttons
  document.addEventListener("click", function (e) {
    if (e.target.closest(".accept-request-btn")) {
      const button = e.target.closest(".accept-request-btn");
      const requestId = button.dataset.requestId;
      acceptRequest(requestId);
    } else if (e.target.closest(".decline-request-btn")) {
      const button = e.target.closest(".decline-request-btn");
      const requestId = button.dataset.requestId;
      declineRequest(requestId);
    }
  });

  // Update friend request count on page load
  updateHeaderRequestCount();

  // Update every 30 seconds for live updates
  setInterval(updateHeaderRequestCount, 30000);
});
