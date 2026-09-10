/**
 * Web Crypto API client-side encryption utility for NexAI
 * Invariant: Master key & plaintext NEVER touch the network or database.
 * Derivation: PBKDF2 with SHA-256 (310,000 iterations) -> 256-bit AES-GCM key.
 */

// Helper to convert ArrayBuffer to Base64
export function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
export function base64ToBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate cryptographically secure random bytes
 */
export function generateSalt(length = 16) {
  const salt = window.crypto.getRandomValues(new Uint8Array(length));
  return bufferToBase64(salt);
}

export function generateIV(length = 12) {
  const iv = window.crypto.getRandomValues(new Uint8Array(length));
  return bufferToBase64(iv);
}

/**
 * Derive AES-GCM 256-bit CryptoKey from Master Password using PBKDF2
 */
export async function deriveKeyFromPassword(masterPassword, saltBase64) {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(masterPassword),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const saltBuffer = base64ToBuffer(saltBase64);

  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 310000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt plaintext string -> { ciphertext, iv, salt } in Base64
 */
export async function encryptSecret(plaintext, masterPassword) {
  const salt = generateSalt(16);
  const iv = generateIV(12);
  const key = await deriveKeyFromPassword(masterPassword, salt);

  const enc = new TextEncoder();
  const encodedPlaintext = enc.encode(plaintext);

  const ivBuffer = base64ToBuffer(iv);
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: new Uint8Array(ivBuffer),
    },
    key,
    encodedPlaintext
  );

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv,
    salt,
  };
}

/**
 * Decrypt base64 ciphertext with master password, iv, and salt
 */
export async function decryptSecret(ciphertextBase64, ivBase64, saltBase64, masterPassword) {
  try {
    const key = await deriveKeyFromPassword(masterPassword, saltBase64);
    const ciphertextBuffer = base64ToBuffer(ciphertextBase64);
    const ivBuffer = base64ToBuffer(ivBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(ivBuffer),
      },
      key,
      ciphertextBuffer
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    throw new Error("Decryption failed. Incorrect master password or corrupted payload.");
  }
}
