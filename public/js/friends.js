// Extracted from views/friends/users.ejs (friends logic)

let searchTimeout;

function searchUsers() {
  const searchTerm = document.getElementById("searchInput").value.trim();
  const currentUrl = new URL(window.location);

  if (searchTerm) {
    currentUrl.searchParams.set("tab", "all");
    currentUrl.searchParams.set("search", searchTerm);
  } else {
    currentUrl.searchParams.set("tab", "all");
    currentUrl.searchParams.delete("search");
  }

  window.location.href = currentUrl.toString();
}

function switchToAllUsers() {
  const currentUrl = new URL(window.location);
  currentUrl.searchParams.set("tab", "all");
  currentUrl.searchParams.delete("search");
  window.location.href = currentUrl.toString();
}

function sendFriendRequestFromUsersPage(userId, userName = "") {
  const addFriendBtn = document.getElementById(`add-friend-btn-${userId}`);
  const actionsContainer = document.getElementById(`friend-actions-${userId}`);

  if (!addFriendBtn) {
    return;
  }

  // Disable button and show loading state
  addFriendBtn.disabled = true;
  addFriendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

  fetch("/friends/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ receiverId: userId }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        showNotification(
          "Friend request sent to " + (userName || "user") + "!",
          "success"
        );

        // Update friend request counters
        updateFriendRequestCounters(1);

        // Update the UI immediately using a more reliable method
        if (actionsContainer) {
          // Clear the container
          actionsContainer.innerHTML = "";

          // Create Request Sent button
          const requestSentBtn = document.createElement("button");
          requestSentBtn.className = "btn btn-success btn-sm me-2";
          requestSentBtn.disabled = true;
          requestSentBtn.innerHTML =
            '<i class="fas fa-check"></i> Request Sent';

          // Create Cancel Request button
          const cancelBtn = document.createElement("button");
          cancelBtn.className =
            "btn btn-outline-secondary btn-sm cancel-request-btn";
          cancelBtn.setAttribute("data-user-id", userId);
          cancelBtn.setAttribute("data-user-name", userName);
          cancelBtn.setAttribute("data-request-id", data.requestId);
          cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel Request';

          // Add buttons to container
          actionsContainer.appendChild(requestSentBtn);
          actionsContainer.appendChild(cancelBtn);
        }

        // Add card to Friend Requests tab dynamically
        addRequestCardToRequestsTab(userId, userName, data.requestId);
      } else {
        // Reset button to original state
        addFriendBtn.disabled = false;
        addFriendBtn.innerHTML = '<i class="fas fa-user-plus"></i> Add Friend';
        showNotification(data.error || "Could not send request", "error");
      }
    })
    .catch(() => {
      // Reset button to original state
      addFriendBtn.disabled = false;
      addFriendBtn.innerHTML = '<i class="fas fa-user-plus"></i> Add Friend';
      showNotification("Could not send request. Please try again.", "error");
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
        showNotification("Friend request accepted!", "success");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showNotification(data.error || "Could not accept request", "error");
      }
    })
    .catch(() => {
      showNotification("Could not accept request. Please try again.", "error");
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
        showNotification("Friend request declined", "info");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showNotification(data.error || "Could not decline request", "error");
      }
    })
    .catch(() => {
      showNotification("Could not decline request. Please try again.", "error");
    });
}

function cancelRequest(requestId) {
  // Find the button that was clicked
  const cancelBtn = event.target.closest("button");

  if (!cancelBtn) {
    return;
  }

  // Disable cancel button and show loading state
  cancelBtn.disabled = true;
  cancelBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Canceling...';

  fetch("/friends/decline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId: requestId }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        showNotification("Friend request cancelled", "info");

        // Update friend request counters
        updateFriendRequestCounters(-1);

        // Remove the request card from Friend Requests tab
        const requestCard = cancelBtn.closest(".col-md-6");
        if (requestCard) {
          requestCard.remove();
        }

        // Update All Users tab if we're on the requests tab
        updateAllUsersTabAfterCancel(requestId);
      } else {
        // Reset cancel button to original state
        cancelBtn.disabled = false;
        cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
        showNotification(data.error || "Could not cancel request", "error");
      }
    })
    .catch(() => {
      // Reset cancel button to original state
      cancelBtn.disabled = false;
      cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
      showNotification("Could not cancel request. Please try again.", "error");
    });
}

function cancelRequestFromAllUsersPage(userId, userName, requestId) {
  const cancelBtn = document.getElementById(`cancel-request-btn-${userId}`);
  const actionsContainer = document.getElementById(`friend-actions-${userId}`);

  if (!cancelBtn) {
    console.error("Cancel button not found");
    return;
  }

  // Disable cancel button and show loading state
  cancelBtn.disabled = true;
  cancelBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Canceling...';

  fetch("/friends/decline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId: requestId || userId }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        showNotification("Friend request cancelled", "info");

        // Update friend request counters
        updateFriendRequestCounters(-1);

        // Update the UI immediately using a more reliable method
        if (actionsContainer) {
          // Clear the container
          actionsContainer.innerHTML = "";

          // Create Add Friend button
          const addFriendBtn = document.createElement("button");
          addFriendBtn.className = "btn btn-primary btn-sm add-friend-btn";
          addFriendBtn.setAttribute("data-user-id", userId);
          addFriendBtn.setAttribute("data-user-name", userName);
          addFriendBtn.innerHTML =
            '<i class="fas fa-user-plus"></i> Add Friend';

          // Add button to container
          actionsContainer.appendChild(addFriendBtn);
        }

        // Remove card from Friend Requests tab
        removeRequestCardFromRequestsTab(requestId);
      } else {
        // Reset cancel button to original state
        cancelBtn.disabled = false;
        cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel Request';
        showNotification(data.error || "Could not cancel request", "error");
      }
    })
    .catch(() => {
      // Reset cancel button to original state
      cancelBtn.disabled = false;
      cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel Request';
      showNotification("Could not cancel request. Please try again.", "error");
    });
}

function removeFriend(friendId, friendName = "") {
  if (
    confirm(
      "Are you sure you want to unfriend " + (friendName || "this user") + "?"
    )
  ) {
    fetch("/friends/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showNotification("Friend removed", "info");
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showNotification(data.error || "Could not remove friend", "error");
        }
      })
      .catch(() => {
        showNotification("Could not remove friend. Please try again.", "error");
      });
  }
}

function updateFriendRequestCounters(change) {
  // Update the tab counter
  const tabCounter = document.querySelector(".badge.bg-warning");
  if (tabCounter) {
    const currentCount = parseInt(tabCounter.textContent) || 0;
    const newCount = Math.max(0, currentCount + change);
    tabCounter.textContent = newCount;
  }

  // Update the header counter
  const headerCounter = document.getElementById("headerRequestCount");
  if (headerCounter) {
    const currentCount = parseInt(headerCounter.textContent) || 0;
    const newCount = Math.max(0, currentCount + change);
    headerCounter.textContent = newCount;

    // Show/hide the badge based on count
    if (newCount > 0) {
      headerCounter.classList.remove("d-none");
    } else {
      headerCounter.classList.add("d-none");
    }
  }
}

function addRequestCardToRequestsTab(userId, userName, requestId) {
  // Find the requests tab content
  const requestsTab = document.getElementById("requests");
  if (!requestsTab) {
    return;
  }

  // Find the row container for the cards
  const rowContainer = requestsTab.querySelector(".row");
  if (!rowContainer) {
    return;
  }

  // Create the new card HTML
  const cardHTML = `
    <div class="col-md-6 col-lg-4 mb-3" id="request-card-${requestId}">
      <div class="card h-100">
        <div class="card-body">
          <div class="d-flex align-items-center mb-3">
            <div class="user-avatar-large me-3" style="width: 50px; height: 50px; font-size: 1.2rem">
              ${userName
                .split(" ")
                .map((n) => n.charAt(0))
                .join("")}
            </div>
            <div class="flex-grow-1">
              <h6 class="mb-1">
                ${userName}
              </h6>
              <p class="text-muted mb-0 small">
                @${userName.toLowerCase().replace(/\s+/g, "")}
              </p>
            </div>
          </div>
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">
              Request sent ${new Date().toLocaleDateString()}
            </small>
            <div class="btn-group" role="group">
              <button class="btn btn-outline-secondary btn-sm" onclick="cancelRequest('${requestId}')">
                <i class="fas fa-times"></i> Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add the card to the row
  rowContainer.insertAdjacentHTML("beforeend", cardHTML);
}

function updateAllUsersTabAfterCancel(requestId) {
  // Find the user card in All Users tab that has this request
  const allUsersTab = document.getElementById("all");
  if (!allUsersTab) {
    return;
  }

  // Look for any user card that has a cancel button with this requestId
  const cancelBtn = allUsersTab.querySelector(
    `[data-request-id="${requestId}"]`
  );
  if (cancelBtn) {
    const actionsContainer = cancelBtn.closest('[id^="friend-actions-"]');
    if (actionsContainer) {
      const userId = cancelBtn.getAttribute("data-user-id");
      const userName = cancelBtn.getAttribute("data-user-name");

      // Update to "Add Friend" state
      actionsContainer.innerHTML = "";

      const addFriendBtn = document.createElement("button");
      addFriendBtn.className = "btn btn-primary btn-sm add-friend-btn";
      addFriendBtn.setAttribute("data-user-id", userId);
      addFriendBtn.setAttribute("data-user-name", userName);
      addFriendBtn.innerHTML = '<i class="fas fa-user-plus"></i> Add Friend';

      actionsContainer.appendChild(addFriendBtn);
    }
  }
}

function removeRequestCardFromRequestsTab(requestId) {
  // Find the card by its ID
  const requestCard = document.getElementById(`request-card-${requestId}`);
  if (requestCard) {
    requestCard.remove();
  }
}

function showNotification(message, type = "info") {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${
    type === "error" ? "danger" : type
  } alert-dismissible fade show position-fixed`;
  alertDiv.style.cssText =
    "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
  alertDiv.innerHTML = `
    <i class="fas fa-${
      type === "success"
        ? "check"
        : type === "error"
        ? "exclamation-triangle"
        : "info-circle"
    }"></i> ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 3000);
}

// Add event listeners
document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("searchInput");

  // Real-time search with debouncing
  searchInput.addEventListener("input", function () {
    clearTimeout(searchTimeout);
    const searchTerm = this.value.trim();

    if (searchTerm.length === 0) {
      return;
    }

    searchTimeout = setTimeout(() => {
      searchUsers();
    }, 500);
  });

  // Search on Enter key
  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      searchUsers();
    }
  });

  // Event delegation for dynamically created buttons
  document.addEventListener("click", function (e) {
    // Add friend button event listeners
    if (e.target.closest(".add-friend-btn")) {
      const button = e.target.closest(".add-friend-btn");
      const userId = button.getAttribute("data-user-id");
      const userName = button.getAttribute("data-user-name");
      sendFriendRequestFromUsersPage(userId, userName);
    }

    // Cancel request button event listeners
    if (e.target.closest(".cancel-request-btn")) {
      const button = e.target.closest(".cancel-request-btn");
      const userId = button.getAttribute("data-user-id");
      const userName = button.getAttribute("data-user-name");
      const requestId = button.getAttribute("data-request-id");
      cancelRequestFromAllUsersPage(userId, userName, requestId);
    }
  });

  // Friends index page specific functionality
  const friendsIndexSearchInput = document.getElementById("searchInput");
  if (friendsIndexSearchInput) {
    // Real-time search with debouncing for friends index
    friendsIndexSearchInput.addEventListener("input", function () {
      clearTimeout(searchTimeout);
      const searchTerm = this.value.trim();

      if (searchTerm.length === 0) {
        clearSearchResults();
        return;
      }

      searchTimeout = setTimeout(() => {
        searchUsers();
      }, 300); // Wait 300ms after user stops typing
    });

    // Search on Enter key for friends index
    friendsIndexSearchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        searchUsers();
      }
    });

    // Load initial request count
    updateRequestCount();
  }
});

// Friends index page functions
function toggleSearch() {
  const searchSection = document.getElementById("searchSection");
  const requestsSection = document.getElementById("requestsSection");

  if (searchSection.classList.contains("d-none")) {
    searchSection.classList.remove("d-none");
    requestsSection.classList.add("d-none");
    document.getElementById("searchInput").focus();
  } else {
    searchSection.classList.add("d-none");
    clearSearchResults();
  }
}

function toggleRequests() {
  const requestsSection = document.getElementById("requestsSection");
  const searchSection = document.getElementById("searchSection");

  if (requestsSection.classList.contains("d-none")) {
    requestsSection.classList.remove("d-none");
    searchSection.classList.add("d-none");
    loadFriendRequests();
  } else {
    requestsSection.classList.add("d-none");
  }
}

function loadFriendRequests() {
  showRequestsLoading();

  fetch("/friends/requests")
    .then((response) => response.json())
    .then((data) => {
      hideRequestsLoading();
      displayRequests(data.requests);
    })
    .catch((error) => {
      console.error("Error loading friend requests:", error);
      hideRequestsLoading();
      showRequestsError("Failed to load friend requests");
    });
}

function displayRequests(requests) {
  const requestsListDiv = document.getElementById("requestsList");
  const noRequestsDiv = document.getElementById("noRequests");

  if (requests.length === 0) {
    requestsListDiv.classList.add("d-none");
    noRequestsDiv.classList.remove("d-none");
    return;
  }

  noRequestsDiv.classList.add("d-none");
  requestsListDiv.classList.remove("d-none");

  requestsListDiv.innerHTML = requests
    .map(
      (request) => `
<div class="card mb-3">
  <div class="card-body">
    <div class="row align-items-center">
      <div class="col-auto">
        <div class="user-avatar-large" style="width: 50px; height: 50px; font-size: 1.2rem;">
          ${(request.sender.firstName || "").charAt(0)}${(
        request.sender.lastName || ""
      ).charAt(0)}
        </div>
      </div>
      <div class="col">
        <h6 class="mb-1">
          ${request.sender.firstName || ""} ${request.sender.lastName || ""}
          ${
            request.sender.firstName || request.sender.lastName
              ? ""
              : '<span class="text-muted">(No name)</span>'
          }
        </h6>
        <p class="text-muted mb-1">@${request.sender.username}</p>
        ${
          request.sender.bio
            ? `<p class="small mb-0">${request.sender.bio}</p>`
            : ""
        }
        <small class="text-muted">Sent ${new Date(
          request.createdAt
        ).toLocaleDateString()}</small>
      </div>
      <div class="col-auto">
        <div class="btn-group" role="group">
          <button class="btn btn-success btn-sm" onclick="acceptRequest('${
            request.id
          }')">
            <i class="fas fa-check"></i> Accept
          </button>
          <button class="btn btn-outline-secondary btn-sm" onclick="declineRequest('${
            request.id
          }')">
            <i class="fas fa-times"></i> Decline
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
`
    )
    .join("");
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
        // Remove the request from the UI
        const requestElement = document
          .querySelector(`[onclick="acceptRequest('${requestId}')"]`)
          .closest(".card");
        requestElement.remove();

        // Check if there are any requests left
        const remainingRequests = document.querySelectorAll(
          "#requestsList .card"
        );
        if (remainingRequests.length === 0) {
          document.getElementById("requestsList").classList.add("d-none");
          document.getElementById("noRequests").classList.remove("d-none");
        }

        // Update request count
        updateRequestCount();

        alert("Friend request accepted!");
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
        // Remove the request from the UI
        const requestElement = document
          .querySelector(`[onclick="declineRequest('${requestId}')"]`)
          .closest(".card");
        requestElement.remove();

        // Check if there are any requests left
        const remainingRequests = document.querySelectorAll(
          "#requestsList .card"
        );
        if (remainingRequests.length === 0) {
          document.getElementById("requestsList").classList.add("d-none");
          document.getElementById("noRequests").classList.remove("d-none");
        }

        // Update request count
        updateRequestCount();

        alert("Friend request declined");
      } else {
        alert(data.error || "Could not decline request");
      }
    })
    .catch(() => {
      alert("Could not decline request. Please try again.");
    });
}

function updateRequestCount() {
  fetch("/friends/requests")
    .then((response) => response.json())
    .then((data) => {
      const countBadge = document.getElementById("requestCount");
      if (data.requests.length > 0) {
        countBadge.textContent = data.requests.length;
        countBadge.classList.remove("d-none");
      } else {
        countBadge.classList.add("d-none");
      }
    })
    .catch((error) => {
      console.error("Error updating request count:", error);
    });
}

function showRequestsLoading() {
  document.getElementById("requestsLoading").classList.remove("d-none");
  document.getElementById("requestsList").classList.add("d-none");
  document.getElementById("noRequests").classList.add("d-none");
}

function hideRequestsLoading() {
  document.getElementById("requestsLoading").classList.add("d-none");
}

function showRequestsError(message) {
  alert(message);
}

function displayResults(users) {
  const resultsDiv = document.getElementById("searchResults");
  const usersListDiv = document.getElementById("usersList");
  const noResultsDiv = document.getElementById("noResults");

  if (users.length === 0) {
    resultsDiv.classList.add("d-none");
    noResultsDiv.classList.remove("d-none");
    return;
  }

  noResultsDiv.classList.add("d-none");
  resultsDiv.classList.remove("d-none");

  usersListDiv.innerHTML = users
    .map(
      (user) => `
<div class="card mb-3">
  <div class="card-body">
    <div class="row align-items-center">
      <div class="col-auto">
        <div class="user-avatar-large" style="width: 50px; height: 50px; font-size: 1.2rem;">
          ${(user.firstName || "").charAt(0)}${(user.lastName || "").charAt(0)}
        </div>
      </div>
      <div class="col">
        <h6 class="mb-1">
          ${user.firstName || ""} ${user.lastName || ""}
          ${
            user.firstName || user.lastName
              ? ""
              : '<span class="text-muted">(No name)</span>'
          }
        </h6>
        <p class="text-muted mb-1">@${user.username}</p>
        ${user.bio ? `<p class="small mb-0">${user.bio}</p>` : ""}
      </div>
      <div class="col-auto">
        <button class="btn btn-primary btn-sm" onclick="sendFriendRequestFromIndex('${
          user.id
        }')">
          <i class="fas fa-user-plus"></i> Add Friend
        </button>
      </div>
    </div>
  </div>
</div>
`
    )
    .join("");
}

function sendFriendRequestFromIndex(userId) {
  fetch("/friends/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ receiverId: userId }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        alert("Friend request sent!");
        // Optionally update UI to show "Request Sent"
      } else {
        alert(data.error || "Could not send request");
      }
    })
    .catch(() => {
      alert("Could not send request. Please try again.");
    });
}

function showLoading() {
  document.getElementById("searchLoading").classList.remove("d-none");
  document.getElementById("searchResults").classList.add("d-none");
  document.getElementById("noResults").classList.add("d-none");
}

function hideLoading() {
  document.getElementById("searchLoading").classList.add("d-none");
}

function clearSearchResults() {
  document.getElementById("searchResults").classList.add("d-none");
  document.getElementById("noResults").classList.add("d-none");
  document.getElementById("usersList").innerHTML = "";
}

function showError(message) {
  // You can implement a better error display here
  alert(message);
}
