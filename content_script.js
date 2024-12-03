// Check if we're in the top frame
if (window.top === window) {
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "getUserData") {
      // Retrieve specific keys from session storage
      const userId = sessionStorage.getItem("USER.id");
      const userName = sessionStorage.getItem("USER.name");
      const instanceId = sessionStorage.getItem("USER.instanceId");

      sendResponse({
        userId: userId || "Not available",
        userName: userName || "Not available",
        instanceId: instanceId || "Not available"
      });
    }
  });
}