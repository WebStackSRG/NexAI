/**
 * NexAI Page Intelligence Content Script
 * Extracts readable article text and active user selection.
 */

// Listen for context requests from background or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_PAGE_CONTEXT") {
    const selectedText = window.getSelection().toString().trim();
    
    // Extract main text (article or body)
    const mainEl = document.querySelector("article") || document.querySelector("main") || document.body;
    let fullText = mainEl ? mainEl.innerText : document.body.innerText;
    // Clean excessive spaces
    fullText = fullText.replace(/\s+/g, " ").trim();

    sendResponse({
      title: document.title,
      url: window.location.href,
      selection: selectedText,
      excerpt: fullText.slice(0, 3000),
    });
  }
});

// Broadcast token if on NexAI web app domain
if (window.location.hostname === "localhost" || window.location.hostname.includes("vercel.app")) {
  try {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token) {
      chrome.runtime.sendMessage({
        action: "STORE_AUTH_TOKEN",
        token,
        user: userStr ? JSON.parse(userStr) : null
      });
    }
  } catch (e) {
    // Ignore iframe or restricted access
  }
}
