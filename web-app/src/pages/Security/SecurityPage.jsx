import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Plus,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import useSecretStore from "../../store/secretStore";
import styles from "./SecurityPage.module.scss";

export default function SecurityPage() {
  const {
    secrets,
    masterPassword,
    isUnlocked,
    isLoading,
    error,
    decryptedCache,
    unlockVault,
    lockVault,
    addSecret,
    deleteSecret,
    revealSecret,
    copyToClipboardWithAutoClear,
  } = useSecretStore();

  const [inputPassword, setInputPassword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // New Secret form state
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("api_key");
  const [value, setValue] = useState("");
  const [formError, setFormError] = useState("");

  const handleUnlock = (e) => {
    e.preventDefault();
    if (!inputPassword.trim()) return;
    unlockVault(inputPassword.trim());
    setInputPassword("");
  };

  const handleAddSecret = async (e) => {
    e.preventDefault();
    if (!label.trim() || !value.trim()) {
      setFormError("Label and Secret Value are required");
      return;
    }
    try {
      setFormError("");
      await addSecret({ label, category, plaintext: value });
      setLabel("");
      setValue("");
      setCategory("api_key");
      setModalOpen(false);
    } catch (err) {
      setFormError(err.message || "Failed to encrypt and store secret");
    }
  };

  const handleCopy = async (secret) => {
    try {
      const id = secret._id || secret.id;
      await copyToClipboardWithAutoClear(secret);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      alert("Failed to copy secret: " + err.message);
    }
  };

  const handleToggleReveal = async (secret) => {
    try {
      await revealSecret(secret);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>Secrets & Privacy Vault</h1>
            <p className={styles.subtitle}>
              Zero-knowledge client-side encryption via Web Crypto API (PBKDF2 + AES-GCM 256-bit).
            </p>
          </div>

          <div className={styles.headerActions}>
            {isUnlocked ? (
              <>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => setModalOpen(true)}
                >
                  <Plus size={16} /> Add Secret
                </button>
                <button
                  type="button"
                  className={styles.btnDanger}
                  onClick={lockVault}
                >
                  <Lock size={16} /> Lock Vault
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {!isUnlocked ? (
        <div className={styles.lockCard}>
          <div className={styles.lockIcon}>
            <Lock size={32} />
          </div>
          <h2 className={styles.lockTitle}>Vault is Locked</h2>
          <p className={styles.lockDesc}>
            Enter your Master Password to derive your AES-GCM session key. Plaintext credentials
            are decrypted locally in memory and never transmitted over the network or saved in MongoDB.
          </p>

          <form className={styles.unlockForm} onSubmit={handleUnlock}>
            <input
              type="password"
              placeholder="Enter master password..."
              value={inputPassword}
              onChange={(e) => setInputPassword(e.target.value)}
              required
            />
            <button type="submit" className={styles.btnPrimary}>
              <Unlock size={16} /> Unlock Vault
            </button>
          </form>

          <div className={styles.securityPills}>
            <span className={styles.pill}>
              <ShieldCheck size={12} /> PBKDF2 310,000 Iterations
            </span>
            <span className={styles.pill}>
              <Key size={12} /> AES-GCM 256-bit Key
            </span>
            <span className={styles.pill}>
              <AlertCircle size={12} /> 30s Clipboard Auto-Purge
            </span>
          </div>
        </div>
      ) : (
        <div className={styles.secretsList}>
          {secrets.length === 0 ? (
            <div className={styles.emptyState}>
              <Key size={36} />
              <p>No credentials stored yet. Click "Add Secret" to encrypt your first key.</p>
            </div>
          ) : (
            secrets.map((secret) => {
              const id = secret._id || secret.id;
              const isRevealed = Boolean(decryptedCache[id]);
              const isCopied = copiedId === id;

              return (
                <div key={id} className={styles.secretCard}>
                  <div className={styles.secretInfo}>
                    <div className={styles.secretHeader}>
                      <span className={styles.secretLabel}>{secret.label}</span>
                      <span className={styles.categoryTag}>{secret.category}</span>
                    </div>
                    <div className={styles.valueRow}>
                      {isRevealed ? (
                        <span className={styles.revealedValue}>{decryptedCache[id]}</span>
                      ) : (
                        <span className={styles.maskedValue}>••••••••••••••••••••••••</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.secretActions}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      title={isRevealed ? "Hide Value" : "Reveal Value"}
                      onClick={() => handleToggleReveal(secret)}
                    >
                      {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>

                    <button
                      type="button"
                      className={styles.iconBtn}
                      title="Copy to Clipboard (30s auto-clear)"
                      onClick={() => handleCopy(secret)}
                    >
                      {isCopied ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
                    </button>

                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.danger}`}
                      title="Delete Secret"
                      onClick={() => {
                        if (confirm(`Delete "${secret.label}"?`)) {
                          deleteSecret(id);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add Secret Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Add Encrypted Secret</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {formError && <div className={styles.errorBanner}>{formError}</div>}

            <form onSubmit={handleAddSecret}>
              <div className={styles.formGroup}>
                <label>Label</label>
                <input
                  type="text"
                  placeholder="e.g. Gemini Production API Key"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="api_key">API Key</option>
                  <option value="password">Password</option>
                  <option value="crypto">Crypto Seed / Key</option>
                  <option value="note">Private Note</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Secret Value (Plaintext)</label>
                <textarea
                  placeholder="Paste confidential credentials here..."
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={isLoading}
                >
                  {isLoading ? "Encrypting..." : "Encrypt & Store"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
