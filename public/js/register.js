document.addEventListener("DOMContentLoaded", function () {
  const usernameInput = document.getElementById("username");
  const usernameFeedback = document.getElementById("username-feedback");
  const birthdayInput = document.getElementById("birthday");
  const birthdayFeedback = document.getElementById("birthday-feedback");
  const passwordInput = document.getElementById("password");
  const passwordFeedback = document.getElementById("password-feedback");
  const password2Input = document.getElementById("password2");
  const password2Feedback = document.getElementById("password2-feedback");
  const submitButton = document.querySelector('button[type="submit"]');
  let checkTimeout;
  let isChecking = false;

  // Create feedback element if it doesn't exist
  if (!usernameFeedback) {
    const feedbackDiv = document.createElement("div");
    feedbackDiv.id = "username-feedback";
    feedbackDiv.className = "form-text";
    usernameInput.parentNode.appendChild(feedbackDiv);
  }

  // Create birthday feedback element if it doesn't exist
  if (!birthdayFeedback) {
    const feedbackDiv = document.createElement("div");
    feedbackDiv.id = "birthday-feedback";
    feedbackDiv.className = "form-text";
    birthdayInput.parentNode.appendChild(feedbackDiv);
  }

  // Create password feedback element if it doesn't exist
  if (!passwordFeedback) {
    const feedbackDiv = document.createElement("div");
    feedbackDiv.id = "password-feedback";
    feedbackDiv.className = "form-text";
    passwordInput.parentNode.appendChild(feedbackDiv);
  }

  // Create password confirmation feedback element if it doesn't exist
  if (!password2Feedback) {
    const feedbackDiv = document.createElement("div");
    feedbackDiv.id = "password2-feedback";
    feedbackDiv.className = "form-text";
    password2Input.parentNode.appendChild(feedbackDiv);
  }

  function showUsernameStatus(message, type) {
    const feedback = document.getElementById("username-feedback");
    feedback.textContent = message;
    feedback.className = `form-text ${type}`;

    // Update input styling
    usernameInput.classList.remove("is-valid", "is-invalid");
    if (type === "text-success") {
      usernameInput.classList.add("is-valid");
    } else if (type === "text-danger") {
      usernameInput.classList.add("is-invalid");
    }
  }

  function showBirthdayStatus(message, type) {
    const feedback = document.getElementById("birthday-feedback");
    feedback.textContent = message;
    feedback.className = `form-text ${type}`;

    // Update input styling
    birthdayInput.classList.remove("is-valid", "is-invalid");
    if (type === "text-success") {
      birthdayInput.classList.add("is-valid");
    } else if (type === "text-danger") {
      birthdayInput.classList.add("is-invalid");
    }
  }

  function showPasswordStatus(message, type) {
    const feedback = document.getElementById("password-feedback");
    feedback.textContent = message;
    feedback.className = `form-text ${type}`;

    // Update input styling
    passwordInput.classList.remove("is-valid", "is-invalid");
    if (type === "text-success") {
      passwordInput.classList.add("is-valid");
    } else if (type === "text-danger") {
      passwordInput.classList.add("is-invalid");
    }
  }

  function showPassword2Status(message, type) {
    const feedback = document.getElementById("password2-feedback");
    feedback.textContent = message;
    feedback.className = `form-text ${type}`;

    // Update input styling
    password2Input.classList.remove("is-valid", "is-invalid");
    if (type === "text-success") {
      password2Input.classList.add("is-valid");
    } else if (type === "text-danger") {
      password2Input.classList.add("is-invalid");
    }
  }

  function validateBirthday(birthday) {
    if (!birthday) {
      showBirthdayStatus("", "");
      birthdayInput.classList.remove("is-valid", "is-invalid");
      return false;
    }

    const birthDate = new Date(birthday);
    const today = new Date();

    // Check if it's a valid date
    if (isNaN(birthDate.getTime())) {
      showBirthdayStatus("Please enter a valid date", "text-danger");
      return false;
    }

    // Check if date is in the future
    if (birthDate > today) {
      showBirthdayStatus("Birthday cannot be in the future", "text-danger");
      return false;
    }

    // Calculate age
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    let actualAge = age;
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      actualAge = age - 1;
    }

    if (actualAge < 16) {
      showBirthdayStatus("You must be at least 16 years old", "text-danger");
      return false;
    }

    // Valid age
    showBirthdayStatus("", "");
    return true;
  }

  function validatePassword(password) {
    if (!password) {
      showPasswordStatus("", "");
      passwordInput.classList.remove("is-valid", "is-invalid");
      return false;
    }

    const requirements = {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    const missingRequirements = [];

    if (!requirements.length) {
      missingRequirements.push("at least 6 characters");
    }
    if (!requirements.uppercase) {
      missingRequirements.push("one uppercase letter");
    }
    if (!requirements.lowercase) {
      missingRequirements.push("one lowercase letter");
    }
    if (!requirements.number) {
      missingRequirements.push("one number");
    }
    if (!requirements.special) {
      missingRequirements.push("one special character");
    }

    if (missingRequirements.length > 0) {
      const message = `Password must contain: ${missingRequirements.join(
        ", "
      )}`;
      showPasswordStatus(message, "text-danger");
      return false;
    }

    // Valid password
    showPasswordStatus("Password meets all requirements", "text-success");
    return true;
  }

  function validatePasswordConfirmation(password, password2) {
    if (!password2) {
      showPassword2Status("", "");
      password2Input.classList.remove("is-valid", "is-invalid");
      return false;
    }

    if (password !== password2) {
      showPassword2Status("Passwords do not match", "text-danger");
      return false;
    }

    // Passwords match
    showPassword2Status("Passwords match", "text-success");
    return true;
  }

  function checkUsernameAvailability(username) {
    if (isChecking) return;

    isChecking = true;
    showUsernameStatus("Checking availability...", "text-muted");
    usernameInput.classList.add("username-checking");

    fetch(`/auth/check-username/${encodeURIComponent(username)}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.available) {
          showUsernameStatus(data.message, "text-success");
          submitButton.disabled = false;
        } else {
          showUsernameStatus(data.message, "text-danger");
          submitButton.disabled = true;
        }
      })
      .catch((error) => {
        console.error("Error checking username:", error);
        showUsernameStatus(
          "Error checking username availability",
          "text-danger"
        );
        submitButton.disabled = true;
      })
      .finally(() => {
        isChecking = false;
        usernameInput.classList.remove("username-checking");
      });
  }

  // Add event listener for username input
  usernameInput.addEventListener("input", function () {
    const username = this.value.trim();

    // Clear previous timeout
    if (checkTimeout) {
      clearTimeout(checkTimeout);
    }

    // Clear feedback if input is empty
    if (username === "") {
      showUsernameStatus("", "");
      submitButton.disabled = false;
      usernameInput.classList.remove(
        "username-checking",
        "is-valid",
        "is-invalid"
      );
      return;
    }

    // Basic validation
    if (username.length < 3) {
      showUsernameStatus(
        "Username must be at least 3 characters",
        "text-danger"
      );
      submitButton.disabled = true;
      return;
    }

    if (username.length > 30) {
      showUsernameStatus(
        "Username must be less than 30 characters",
        "text-danger"
      );
      submitButton.disabled = true;
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      showUsernameStatus(
        "Username can only contain letters, numbers, and underscores",
        "text-danger"
      );
      submitButton.disabled = true;
      return;
    }

    // Debounce the API call
    checkTimeout = setTimeout(() => {
      checkUsernameAvailability(username);
    }, 500);
  });

  // Add event listener for birthday input
  birthdayInput.addEventListener("change", function () {
    const birthday = this.value;
    validateBirthday(birthday);
  });

  // Add event listener for password input
  passwordInput.addEventListener("input", function () {
    const password = this.value;
    validatePassword(password);

    // Also validate password confirmation if it has a value
    if (password2Input.value) {
      validatePasswordConfirmation(password, password2Input.value);
    }
  });

  // Add event listener for password confirmation input
  password2Input.addEventListener("input", function () {
    const password2 = this.value;
    const password = passwordInput.value;
    validatePasswordConfirmation(password, password2);
  });

  // Add event listener for form submission
  document.querySelector("form").addEventListener("submit", function (e) {
    const username = usernameInput.value.trim();
    const birthday = birthdayInput.value;
    const password = passwordInput.value;
    const password2 = password2Input.value;

    // If username is empty or invalid, prevent submission
    if (
      !username ||
      username.length < 3 ||
      username.length > 30 ||
      !/^[a-zA-Z0-9_]+$/.test(username)
    ) {
      e.preventDefault();
      showUsernameStatus("Please enter a valid username", "text-danger");
      usernameInput.focus();
      return;
    }

    // If we're still checking availability, prevent submission
    if (isChecking) {
      e.preventDefault();
      showUsernameStatus(
        "Please wait while we check username availability...",
        "text-muted"
      );
      return;
    }

    // If username is invalid (has is-invalid class), prevent submission
    if (usernameInput.classList.contains("is-invalid")) {
      e.preventDefault();
      showUsernameStatus("Please choose a different username", "text-danger");
      usernameInput.focus();
      return;
    }

    // Validate birthday
    if (!validateBirthday(birthday)) {
      e.preventDefault();
      showBirthdayStatus("Please enter a valid birthday", "text-danger");
      birthdayInput.focus();
      return;
    }

    // Validate password
    if (!validatePassword(password)) {
      e.preventDefault();
      showPasswordStatus("Please enter a valid password", "text-danger");
      passwordInput.focus();
      return;
    }

    // Validate password confirmation
    if (!validatePasswordConfirmation(password, password2)) {
      e.preventDefault();
      showPassword2Status("Please confirm your password", "text-danger");
      password2Input.focus();
      return;
    }
  });
});
