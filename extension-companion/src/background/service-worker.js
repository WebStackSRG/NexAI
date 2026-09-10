/**
 * NexAI Companion — Background Service Worker (Manifest V3)
 * Handles context menus, commands, tab session captures, and JWT syncing.
 */

const API_BASE = "http://localhost:5000";

// Set up Context Menus on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "nexai-ask-selection",
    title: "Ask NexAI about \"%s\"",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "nexai-summarize-page",
    title: "Summarize this page with NexAI",
    contexts: ["page"]
  });

  chrome.contextMenus.create({
    id: "nexai-save-tabs",
    title: "Save open tabs to NexAI Workspace",
    contexts: ["action"]
  });
});

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "nexai-ask-selection" && info.selectionText) {
    await chrome.storage.local.set({
      pendingQuery: `Explain or summarize this excerpt:\n\"${info.selectionText}\"`,
      pendingSourceUrl: tab.url,
      pendingSourceTitle: tab.title
    });
    // Open action popup
    chrome.action.openPopup();
  } else if (info.menuItemId === "nexai-summarize-page") {
    // Request page context from content script
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: "GET_PAGE_CONTEXT" });
      await chrome.storage.local.set({
        pendingQuery: `Summarize the key points of this webpage: \"${tab.title}\"\n\n${response?.excerpt || ""}`,
        pendingSourceUrl: tab.url,
        pendingSourceTitle: tab.title
      });
      chrome.action.openPopup();
    } catch (e) {
      console.warn("Could not inject content script:", e);
    }
  } else if (info.menuItemId === "nexai-save-tabs") {
    await captureAndSaveTabs();
  }
});

// Capture all open tabs in the current window and save to Workspace Sessions
async function captureAndSaveTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const validTabs = tabs
    .filter(t => t.url && !t.url.startsWith("chrome://") && !t.url.startsWith("chrome-extension://"))
    .map(t => ({ title: t.title || "Untitled Tab", url: t.url }));

  if (validTabs.length === 0) return;

  const storage = await chrome.storage.local.get(["token"]);
  const token = storage.token;

  if (!token) {
    await chrome.storage.local.set({
      sessionNotice: "Please sign in to NexAI to sync workspace sessions."
    });
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/focus/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: `Tab Snapshot (${new Date().toLocaleDateString()})`,
        description: `Captured ${validTabs.length} tabs from Chrome window`,
        links: validTabs
      })
    });

    if (res.ok) {
      chrome.action.setBadgeText({ text: "✓" });
      chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
      setTimeout(() => chrome.action.setBadgeText({ text: "" }), 3000);
    }
  } catch (err) {
    console.error("Failed to save workspace session:", err);
  }
}

// Message passing handler from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "SAVE_CURRENT_TABS") {
    captureAndSaveTabs().then(() => sendResponse({ success: true }));
    return true; // async
  }

  if (message.action === "STORE_AUTH_TOKEN") {
    chrome.storage.local.set({ token: message.token, user: message.user }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
