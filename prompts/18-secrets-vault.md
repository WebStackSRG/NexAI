# Implementation Specification: Feature 18 — Secrets Vault (Web Crypto)

## Goal
Implement a Zero-Knowledge Secrets Vault where sensitive keys, credentials, and notes are encrypted on the client side using the native Web Crypto API (PBKDF2 key derivation with 310,000 iterations + AES-GCM 256-bit encryption). Plaintext is NEVER sent over the network or stored in the database. Features include master password unlock/lock, salt generation, secret CRUD, masked displays, and 30-second clipboard auto-clear.

## Skills / Docs Read
- context/build-plan.md (Feature 18 specification)
- context/data-models.md (Secret schema: userId, label, ciphertext, iv, salt, category)
- context/code-standards.md (Security invariants, zero unencrypted secrets in transit)
- AGENTS.md (Web Crypto API requirement, Suggest -> Review -> Confirm for mutations)

## Assumptions
- Web Crypto API (window.crypto.subtle) is standard in modern browsers.
- Key derivation uses PBKDF2 with SHA-256, 310,000 iterations, derived to a 256-bit AES-GCM key.
- Each secret has its own IV (12 bytes) and Salt (16 bytes) stored as base64 alongside the ciphertext.
- Master password is held in browser memory only while the vault is unlocked, and cleared on lock or page unmount.

## Exact Files to Modify / Create
- [NEW] prompts/18-secrets-vault.md
- [NEW] server/src/models/Secret.js
- [NEW] server/src/controllers/secret.controller.js
- [NEW] server/src/routes/secret.routes.js
- [MODIFY] server/src/app.js (mount /secrets route)
- [NEW] server/test-secrets-e2e.js (automated test)
- [NEW] web-app/src/lib/crypto.js (Web Crypto PBKDF2 + AES-GCM helper)
- [NEW] web-app/src/store/secretStore.js (Zustand store for secrets)
- [MODIFY] web-app/src/pages/Security/SecurityPage.jsx (Master password modal, list, CRUD, reveal/copy)
- [MODIFY] web-app/src/pages/Security/SecurityPage.module.scss (Dark theme vault styling)

## Security & Auth Invariants
1. Backend receives ONLY base64 ciphertext, iv, salt, and label. Zero plaintext.
2. Master password is never transmitted or hashed on the backend.
3. Protected by JWT middleware (verifyToken).
4. Zod schema validation on POST and PUT.
5. Auto-clear decrypted clipboard contents after 30 seconds.

## Acceptance Criteria
1. User can set/enter Master Password to unlock vault session in memory.
2. User can add a secret with label, category, and value (encrypted client-side before POST).
3. Secrets are listed with masked text.
4. User can click to reveal/decrypt with active session key, or copy to clipboard with 30s auto-clear.
5. User can delete a secret.
6. Vault can be manually locked, wiping key from memory.

## Manual / CLI Verification Test Steps
1. Run node server/test-secrets-e2e.js verifying encrypted payload storage and JWT protection.
2. Run npm run build in web-app/ to ensure clean compilation.
