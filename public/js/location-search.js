// Location Search Functionality
// Uses OpenStreetMap Nominatim API for location suggestions

class LocationSearch {
  constructor(inputId, options = {}) {
    this.input = document.getElementById(inputId);
    this.options = {
      debounceMs: 300,
      maxResults: 5,
      minQueryLength: 2,
      ...options,
    };

    this.searchTimeout = null;
    this.suggestionsContainer = null;
    this.isLoading = false;

    this.init();
  }

  init() {
    if (!this.input) return;

    // Create suggestions container
    this.createSuggestionsContainer();

    // Add event listeners
    this.input.addEventListener("input", this.handleInput.bind(this));
    this.input.addEventListener("focus", this.handleFocus.bind(this));
    this.input.addEventListener("blur", this.handleBlur.bind(this));
    this.input.addEventListener("keydown", this.handleKeydown.bind(this));

    // Close suggestions when clicking outside
    document.addEventListener("click", this.handleOutsideClick.bind(this));
  }

  createSuggestionsContainer() {
    // Remove existing container if any
    if (this.suggestionsContainer) {
      this.suggestionsContainer.remove();
    }

    // Create new container
    this.suggestionsContainer = document.createElement("div");
    this.suggestionsContainer.className = "location-suggestions";
    this.suggestionsContainer.style.display = "none";

    // Insert after input
    this.input.parentNode.style.position = "relative";
    this.input.parentNode.appendChild(this.suggestionsContainer);
  }

  handleInput(event) {
    const query = event.target.value.trim();

    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Hide suggestions if query is too short
    if (query.length < this.options.minQueryLength) {
      this.hideSuggestions();
      return;
    }

    // Debounce search
    this.searchTimeout = setTimeout(() => {
      this.searchLocations(query);
    }, this.options.debounceMs);
  }

  handleFocus() {
    const query = this.input.value.trim();
    if (query.length >= this.options.minQueryLength) {
      this.searchLocations(query);
    }
  }

  handleBlur() {
    // Delay hiding to allow for clicks on suggestions
    setTimeout(() => {
      if (!this.suggestionsContainer.matches(":hover")) {
        this.hideSuggestions();
      }
    }, 150);
  }

  handleKeydown(event) {
    const suggestions = this.suggestionsContainer.querySelectorAll(
      ".location-suggestion"
    );
    const currentIndex = Array.from(suggestions).findIndex((el) =>
      el.classList.contains("active")
    );

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.navigateSuggestions(currentIndex + 1, suggestions);
        break;
      case "ArrowUp":
        event.preventDefault();
        this.navigateSuggestions(currentIndex - 1, suggestions);
        break;
      case "Enter":
        event.preventDefault();
        if (currentIndex >= 0) {
          this.selectSuggestion(suggestions[currentIndex]);
        }
        break;
      case "Escape":
        this.hideSuggestions();
        this.input.blur();
        break;
    }
  }

  navigateSuggestions(newIndex, suggestions) {
    // Remove active class from current
    suggestions.forEach((el) => el.classList.remove("active"));

    // Handle wrapping
    if (newIndex >= suggestions.length) newIndex = 0;
    if (newIndex < 0) newIndex = suggestions.length - 1;

    // Add active class to new
    if (suggestions[newIndex]) {
      suggestions[newIndex].classList.add("active");
      suggestions[newIndex].scrollIntoView({ block: "nearest" });
    }
  }

  handleOutsideClick(event) {
    if (
      !this.input.contains(event.target) &&
      !this.suggestionsContainer.contains(event.target)
    ) {
      this.hideSuggestions();
    }
  }

  async searchLocations(query) {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoading();

    try {
      // Enhanced search with better parameters for towns and cities
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=${
          this.options.maxResults
        }&addressdetails=1&featuretype=city,town,village,suburb&countrycodes=`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch locations");
      }

      let locations = await response.json();

      // If we don't get enough results, try a broader search
      if (locations.length < 3) {
        const broaderResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&limit=${this.options.maxResults}&addressdetails=1`
        );

        if (broaderResponse.ok) {
          const broaderLocations = await broaderResponse.json();
          // Combine and deduplicate results
          const allLocations = [...locations, ...broaderLocations];
          const uniqueLocations = this.deduplicateLocations(allLocations);
          locations = uniqueLocations.slice(0, this.options.maxResults);
        }
      }

      this.displaySuggestions(locations);
    } catch (error) {
      console.error("Location search error:", error);
      this.showError("Failed to search locations");
    } finally {
      this.isLoading = false;
    }
  }

  displaySuggestions(locations) {
    if (locations.length === 0) {
      this.showNoResults();
      return;
    }

    this.suggestionsContainer.innerHTML = "";

    locations.forEach((location) => {
      const suggestion = document.createElement("div");
      suggestion.className = "location-suggestion";

      // Format display name
      const displayName = this.formatLocationName(location);

      const contextInfo = this.getLocationContext(location);

      suggestion.innerHTML = `
        <div class="location-name">${displayName}</div>
        <div class="location-details">${contextInfo}</div>
      `;

      // Handle click
      suggestion.addEventListener("click", () => {
        this.selectSuggestion(suggestion, location);
      });

      this.suggestionsContainer.appendChild(suggestion);
    });

    this.showSuggestions();
  }

  formatLocationName(location) {
    // Prioritize towns, villages, and cities
    if (location.address.town) return location.address.town;
    if (location.address.village) return location.address.village;
    if (location.address.city) return location.address.city;
    if (location.address.suburb) return location.address.suburb;

    // Fall back to state/country
    if (location.address.state && location.address.country) {
      return `${location.address.state}, ${location.address.country}`;
    }

    // Last resort: use display name
    return location.display_name.split(",")[0];
  }

  deduplicateLocations(locations) {
    const seen = new Set();
    return locations.filter((location) => {
      const key = location.place_id || location.osm_id || location.display_name;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  getLocationContext(location) {
    const parts = [];

    // Add relevant context parts
    if (
      location.address.county &&
      location.address.county !== location.address.town
    ) {
      parts.push(location.address.county);
    }
    if (
      location.address.state &&
      location.address.state !== location.address.county
    ) {
      parts.push(location.address.state);
    }
    if (location.address.country) {
      parts.push(location.address.country);
    }

    return parts.join(", ");
  }

  selectSuggestion(suggestionElement, locationData) {
    if (locationData) {
      // Use formatted name for input
      const displayName = this.formatLocationName(locationData);
      this.input.value = displayName;

      // Trigger change event
      this.input.dispatchEvent(new Event("change", { bubbles: true }));

      // Store full location data if needed
      this.input.dataset.fullLocation = JSON.stringify(locationData);
    }

    this.hideSuggestions();
  }

  showLoading() {
    this.suggestionsContainer.innerHTML = `
      <div class="location-suggestion text-center">
        <div class="mb-2">
          <div class="spinner-border spinner-border-sm text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        <div class="text-muted">Searching locations...</div>
      </div>
    `;
    this.showSuggestions();
  }

  showNoResults() {
    this.suggestionsContainer.innerHTML = `
      <div class="location-suggestion text-center">
        <div class="mb-2">
          <i class="fas fa-search text-muted"></i>
        </div>
        <div class="text-muted">No locations found</div>
      </div>
    `;
    this.showSuggestions();
  }

  showError(message) {
    this.suggestionsContainer.innerHTML = `
      <div class="location-suggestion text-center">
        <div class="mb-2">
          <i class="fas fa-exclamation-triangle text-danger"></i>
        </div>
        <div class="text-danger">${message}</div>
      </div>
    `;
    this.showSuggestions();
  }

  showSuggestions() {
    this.suggestionsContainer.style.display = "block";
  }

  hideSuggestions() {
    this.suggestionsContainer.style.display = "none";
  }

  // Public method to get selected location data
  getSelectedLocation() {
    const fullLocation = this.input.dataset.fullLocation;
    return fullLocation ? JSON.parse(fullLocation) : null;
  }

  // Public method to clear
  clear() {
    this.input.value = "";
    this.input.dataset.fullLocation = "";
    this.hideSuggestions();
  }
}

// Initialize location search for existing inputs
document.addEventListener("DOMContentLoaded", function () {
  // Initialize for registration form
  if (document.getElementById("location")) {
    new LocationSearch("location");
  }

  // Initialize for profile edit form
  if (document.getElementById("editLocation")) {
    new LocationSearch("editLocation");
  }
});
