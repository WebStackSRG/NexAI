const API_BASE = "http://localhost:5000";
const WEB_APP_BASE = "http://localhost:5173";

const messagesContainer = document.getElementById("messages-container");
const queryInput = document.getElementById("query-input");
const sendBtn = document.getElementById("send-btn");
const saveTabsBtn = document.getElementById("save-tabs-btn");
const openAppBtn = document.getElementById("open-app-btn");
const contextPill = document.getElementById("context-pill");
const contextTitle = document.getElementById("context-title");
const clearContextBtn = document.getElementById("clear-context-btn");
const statusBanner = document.getElementById("status-banner");

let activePageContext = null;

// Initialize popup and check for pending context or queries
document.addEventListener("DOMContentLoaded", async () => {
  // Check pending query or page context stored by background script
  const storage = await chrome.storage.local.get(["pendingQuery", "pendingSourceUrl", "pendingSourceTitle", "sessionNotice"]);

  if (storage.sessionNotice) {
    showStatus(storage.sessionNotice, 4000);
    await chrome.storage.local.remove("sessionNotice");
  }

  if (storage.pendingSourceTitle) {
    activePageContext = {
      title: storage.pendingSourceTitle,
      url: storage.pendingSourceUrl,
    };
    contextTitle.textContent = storage.pendingSourceTitle;
    contextPill.style.display = "flex";
  }

  if (storage.pendingQuery) {
    queryInput.value = storage.pendingQuery;
    await chrome.storage.local.remove(["pendingQuery", "pendingSourceUrl", "pendingSourceTitle"]);
  }

  queryInput.focus();
});

// Clear context pill
clearContextBtn.addEventListener("click", () => {
  activePageContext = null;
  contextPill.style.display = "none";
});

// Open full web app
openAppBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: WEB_APP_BASE });
});

// Save open tabs
saveTabsBtn.addEventListener("click", async () => {
  chrome.runtime.sendMessage({ action: "SAVE_CURRENT_TABS" }, (response) => {
    showStatus("Open tabs saved to NexAI Workspace!", 3000);
  });
});

// Send query
sendBtn.addEventListener("click", handleSend);
queryInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

async function handleSend() {
  const text = queryInput.value.trim();
  if (!text) return;

  // Render user message
  appendMessage("user", text);
  queryInput.value = "";

  // Check auth token
  const storage = await chrome.storage.local.get(["token"]);
  const token = storage.token;

  if (!token) {
    appendMessage(
      "assistant",
      "Please log in to the NexAI Web App first to chat directly with your models and knowledge library. Click the top-right button to open the app."
    );
    return;
  }

  const thinkingEl = appendMessage("assistant", "Thinking with Gemini 2.0 Flash...");

  try {
    const fullPrompt = activePageContext
      ? `[Context: ${activePageContext.title} (${activePageContext.url})]\n\n${text}`
      : text;

    const res = await fetch(`${API_BASE}/chat/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ message: fullPrompt })
    });

    if (!res.ok) throw new Error("Backend response error: " + res.statusText);

    // Read SSE stream or text
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";

    thinkingEl.textContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.token) {
              accumulated += data.token;
              thinkingEl.textContent = accumulated;
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
          } catch (e) {}
        }
      }
    }

    if (!accumulated) {
      thinkingEl.textContent = "Response received.";
    }
  } catch (err) {
    thinkingEl.textContent = "Error: " + err.message;
  }
}

function appendMessage(role, text) {
  const el = document.createElement("div");
  el.className = `message ${role}`;
  el.textContent = text;
  messagesContainer.appendChild(el);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  return el;
}

function showStatus(msg, timeout = 3000) {
  statusBanner.textContent = msg;
  statusBanner.style.display = "block";
  setTimeout(() => {
    statusBanner.style.display = "none";
  }, timeout);
}
