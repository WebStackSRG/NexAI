import { create } from "zustand";
import { encryptSecret, decryptSecret } from "../lib/crypto";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function getAuthHeaders() {
  const token = localStorage.getItem("token") || "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

const useSecretStore = create((set, get) => ({
  secrets: [],
  masterPassword: null,
  isUnlocked: false,
  isLoading: false,
  error: null,
  decryptedCache: {}, // id -> plaintext
  clearTimeouts: {}, // id -> timeoutId for 30s auto-clear

  // Unlock / set master password in session memory
  unlockVault: (password) => {
    set({ masterPassword: password, isUnlocked: true, error: null });
    get().fetchSecrets();
  },

  // Lock vault and purge all plaintext & keys from memory
  lockVault: () => {
    // Clear all pending timeouts
    const { clearTimeouts } = get();
    Object.values(clearTimeouts).forEach(clearTimeout);
    set({
      masterPassword: null,
      isUnlocked: false,
      decryptedCache: {},
      clearTimeouts: {},
      error: null,
    });
  },

  fetchSecrets: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/secrets`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error(`Failed to load secrets: ${res.statusText}`);
      }
      const data = await res.json();
      set({ secrets: data.secrets || [], isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  addSecret: async ({ label, category, plaintext }) => {
    const { masterPassword, secrets } = get();
    if (!masterPassword) throw new Error("Vault is locked");

    set({ isLoading: true, error: null });
    try {
      const { ciphertext, iv, salt } = await encryptSecret(plaintext, masterPassword);
      const res = await fetch(`${API_BASE}/secrets`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ label, category, ciphertext, iv, salt }),
      });
      if (!res.ok) throw new Error("Failed to save encrypted secret");
      const data = await res.json();
      set({ secrets: [data.secret, ...secrets], isLoading: false });
      return data.secret;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteSecret: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/secrets/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete secret");
      const { secrets, decryptedCache } = get();
      const updatedCache = { ...decryptedCache };
      delete updatedCache[id];
      set({
        secrets: secrets.filter((s) => (s._id || s.id) !== id),
        decryptedCache: updatedCache,
        isLoading: false,
      });
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  // Decrypt and temporarily cache secret
  revealSecret: async (secret) => {
    const { masterPassword, decryptedCache } = get();
    const id = secret._id || secret.id;
    if (decryptedCache[id]) return decryptedCache[id];
    if (!masterPassword) throw new Error("Vault is locked");

    try {
      const decrypted = await decryptSecret(
        secret.ciphertext,
        secret.iv,
        secret.salt,
        masterPassword
      );
      set({
        decryptedCache: { ...get().decryptedCache, [id]: decrypted },
      });
      return decrypted;
    } catch (err) {
      throw new Error("Incorrect master password or corrupted secret");
    }
  },

  // Copy to clipboard with 30s auto-clear safety
  copyToClipboardWithAutoClear: async (secret) => {
    const plaintext = await get().revealSecret(secret);
    await navigator.clipboard.writeText(plaintext);

    const id = secret._id || secret.id;
    const { clearTimeouts } = get();
    if (clearTimeouts[id]) clearTimeout(clearTimeouts[id]);

    const timeoutId = setTimeout(async () => {
      try {
        const currentClipboard = await navigator.clipboard.readText();
        if (currentClipboard === plaintext) {
          await navigator.clipboard.writeText("");
        }
      } catch (e) {
        // Clipboard read permission might not be granted
      }
    }, 30000);

    set({
      clearTimeouts: { ...get().clearTimeouts, [id]: timeoutId },
    });
  },
}));

export default useSecretStore;
