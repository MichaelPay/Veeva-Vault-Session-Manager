document.addEventListener("DOMContentLoaded", init);

function init() {
  // Hide the snackbar initially
  const snackbar = document.getElementById("snackbar");
  snackbar.style.visibility = "hidden";

  // Fetch matching cookies when the popup loads
  fetchMatchingCookies();

  // Add event listener for the refresh button
  const refreshButton = document.getElementById("refreshButton");
  if (refreshButton) {
    refreshButton.addEventListener("click", fetchMatchingCookies);
  }

  // Add event listener for the delete button
  const deleteButton = document.getElementById("deleteButton");
  if (deleteButton) {
    deleteButton.addEventListener("click", deleteSelectedCookie);
  }

  // Add event listener for the login button
  const loginButton = document.getElementById("loginButton");
  if (loginButton) {
    loginButton.addEventListener("click", () => {
      window.open('https://login.veevavault.com', '_blank');
    });
  }
}

// ...existing code...

function fetchMatchingCookies() {
  // Fetch TK cookies
  chrome.cookies.getAll({ domain: ".veevavault.com", name: "TK" }, (tkCookies) => {
    const cookieSelect = document.getElementById("cookieSelect");
    const loginButton = document.getElementById("loginButton");

    if (tkCookies.length === 0) {
      cookieSelect.innerHTML = '<option>No Veeva Vault Sessions found</option>';
      loginButton.style.display = "block";
      return;
    }

    // Clear existing options
    cookieSelect.innerHTML = "";
    loginButton.style.display = "none";

    // Populate the dropdown with cookie details
    tkCookies.forEach((cookie, index) => {
      const option = document.createElement("option");
      option.value = index;
      const cleanDomain = cookie.domain.startsWith(".")
        ? cookie.domain.slice(1)
        : cookie.domain;
      const fullUrl = `https://${cleanDomain}${cookie.path}`;
      option.textContent = fullUrl;
      cookieSelect.appendChild(option);
    });

    // Add event listener for selection change
    cookieSelect.onchange = function () {
      const selectedCookie = tkCookies[this.value];
      displayCookieDetails(selectedCookie);
      localStorage.setItem("selectedCookieIndex", this.value);
      location.reload(); // Refresh the page when a different cookie is selected
    };

    // Preselect the last selected cookie
    const selectedCookieIndex = localStorage.getItem("selectedCookieIndex");
    if (selectedCookieIndex !== null && tkCookies[selectedCookieIndex]) {
      cookieSelect.value = selectedCookieIndex;
      displayCookieDetails(tkCookies[selectedCookieIndex]);
    } else if (tkCookies.length > 0) {
      // Display details for the first cookie by default
      displayCookieDetails(tkCookies[0]);
    }
  });
}

function displayCookieDetails(cookie) {
  const detailsDiv = document.getElementById("details");
  detailsDiv.style.display = "block";

  const sessionIdSpan = document.getElementById("sessionId");
  sessionIdSpan.textContent = cookie.value;

  const cleanDomain = cookie.domain.startsWith(".") ? cookie.domain.slice(1) : cookie.domain;
  const fullUrl = `https://${cleanDomain}${cookie.path}`;

  // Update URL display
  document.getElementById("url").textContent = fullUrl;

  // Fetch and display the instanceId from veevaUserSsoSettings
  fetchInstanceId(cookie.domain);

  // Fetch and display USER data from sessionStorage
  fetchUserData(cookie.domain, fullUrl);

  // Set up copy and open icons
  document.getElementById("copySessionId").onclick = () =>
    copyToClipboard(cookie.value, "Session ID");
  document.getElementById("copyUrl").onclick = () =>
    copyToClipboard(fullUrl, "URL");
  document.getElementById("openUrl").onclick = () => {
    window.open(fullUrl, '_blank');
  };
}

function fetchUserData(domain, fullUrl) {
  const cleanDomain = domain.startsWith(".") ? domain.slice(1) : domain;
  const urlPattern = `*://*.${cleanDomain}/*`;

  chrome.tabs.query({ url: urlPattern }, (tabs) => {
    if (tabs.length > 0) {
      const tabId = tabs[0].id;
      chrome.tabs.sendMessage(
        tabId,
        { action: "getUserData", url: fullUrl },
        (response) => {
          if (chrome.runtime.lastError) {
            injectContentScript(tabId, () => {
              chrome.tabs.sendMessage(
                tabId,
                { action: "getUserData", url: fullUrl },
                (response) => handleUserData(response, fullUrl)
              );
            });
          } else {
            handleUserData(response, fullUrl);
          }
        }
      );
    } else {
      displayMessage(
        "Please log into the Vault instance and have the tab open to retrieve user data."
      );
      hideUserDetails();
    }
  });
}

function fetchInstanceId(domain) {
  chrome.cookies.getAll(
    { domain: domain, name: "veevaUserSsoSettings" },
    (cookies) => {
      const instanceIdSpan = document.getElementById("instanceId");
      if (cookies.length > 0) {
        try {
          let value = cookies[0].value;
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          value = value.replace(/\\"/g, '"');
          const settings = JSON.parse(value);
          const instanceId = settings.instanceId || "Not available";
          instanceIdSpan.textContent = instanceId;
          document.getElementById("copyInstanceId").onclick = () =>
            copyToClipboard(instanceId, "Instance ID");
        } catch (e) {
          // Fallback to USER.instanceId if parsing fails
          fetchUserDataForInstanceId(domain);
        }
      } else {
        instanceIdSpan.textContent = "veevaUserSsoSettings cookie not found";
      }
    }
  );
}

function fetchUserDataForInstanceId(domain) {
  const cleanDomain = domain.startsWith(".") ? domain.slice(1) : domain;
  const urlPattern = `*://*.${cleanDomain}/*`;

  chrome.tabs.query({ url: urlPattern }, (tabs) => {
    if (tabs.length > 0) {
      const tabId = tabs[0].id;
      chrome.tabs.sendMessage(
        tabId,
        { action: "getUserData", url: `https://${cleanDomain}` },
        (response) => {
          if (response && response.instanceId) {
            const instanceIdSpan = document.getElementById("instanceId");
            instanceIdSpan.textContent = response.instanceId;
            document.getElementById("copyInstanceId").onclick = () =>
              copyToClipboard(response.instanceId, "Instance ID");
          } else {
            const instanceIdSpan = document.getElementById("instanceId");
            instanceIdSpan.textContent = "Instance ID not available";
          }
        }
      );
    } else {
      const instanceIdSpan = document.getElementById("instanceId");
      instanceIdSpan.textContent = "Please log into the Vault instance and have the tab open to retrieve instance ID.";
    }
  });
}

function injectContentScript(tabId, callback) {
  chrome.scripting.executeScript(
    {
      target: { tabId: tabId },
      files: ["content_script.js"],
    },
    callback
  );
}

function handleUserData(response, url) {
  if (response) {
    const userId = response.userId || "Not available";
    const userName = response.userName || "Not available";

    if (userId === "Not available" || userName === "Not available") {
      displayMessage(
        `USER data not found for URL ${url}. Please log into the Vault instance and ensure the tab is open.`
      );
      hideUserDetails();
    } else {
      updateUI({ userId, userName, url });
      hideMessage();
    }
  } else {
    displayMessage(
      `USER data not found for URL ${url}. Please log into the Vault instance and ensure the tab is open.`
    );
    hideUserDetails();
  }
}

function updateUI({ userId = "N/A", userName = "N/A", url = "" }) {
  document.getElementById("userId").textContent = userId;
  document.getElementById("userName").textContent = userName;
  document.getElementById("url").textContent = url;

  const userDetailsDiv = document.getElementById("userDetails");
  userDetailsDiv.style.display = "block";

  document.getElementById("copyUrl").onclick = () => copyToClipboard(url, "URL");
  document.getElementById("copyUserName").onclick = () =>
    copyToClipboard(userName, "User Name");
  document.getElementById("copyUserId").onclick = () => copyToClipboard(userId, "User ID");
}

function hideUserDetails() {
  const userDetailsDiv = document.getElementById("userDetails");
  userDetailsDiv.style.display = "none";
}

function hideMessage() {
  const messageDiv = document.getElementById("message");
  messageDiv.style.display = "none";
}

function copyToClipboard(text, label) {
  navigator.clipboard.writeText(text).then(
    () => {
      showTemporaryMessage(`${label} Copied to Clipboard!`);
    },
    (err) => {
      console.error("Could not copy text: ", err);
    }
  );
}

function showTemporaryMessage(message) {
  const snackbar = document.getElementById("snackbar");
  snackbar.textContent = message;
  snackbar.className = "snackbar show";
  snackbar.style.visibility = "visible"; // Ensure snackbar is visible
  
  // Position snackbar at the right corner of the page
  snackbar.style.right = "20px";
  snackbar.style.bottom = "20px";
  snackbar.style.left = "auto"; // Reset left to auto

  setTimeout(() => {
    snackbar.className = snackbar.className.replace("show", "");
    snackbar.style.visibility = "hidden"; // Hide snackbar after timeout
    snackbar.textContent = ""; // Reset snackbar content to avoid growing
  }, 3000);
}

function displayMessage(message) {
  const messageDiv = document.getElementById("message");
  messageDiv.textContent = message;
  messageDiv.style.display = "block";
}

function deleteSelectedCookie() {
  const cookieSelect = document.getElementById("cookieSelect");
  const selectedIndex = cookieSelect.value;
  const selectedOption = cookieSelect.options[selectedIndex];
  const url = new URL(selectedOption.textContent);
  chrome.cookies.remove({ url: url.origin, name: "TK" }, () => {
    fetchMatchingCookies();
    showTemporaryMessage("Cookie Deleted!");
  });
}
