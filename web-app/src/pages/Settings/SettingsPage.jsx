import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';
import { fetchSettings, updateSettings } from '../../lib/userApi';
import styles from './SettingsPage.module.scss';

const PERSONA_MODES = [
  {
    id: 'general',
    name: 'General Assistant',
    badge: 'Standard',
    desc: 'Balanced reasoning, broad knowledge, and clear explanations across any domain.'
  },
  {
    id: 'developer',
    name: 'Software Engineer',
    badge: 'Code & Arch',
    desc: 'Emphasizes strict syntax, system architecture, zero-defect patterns, and minimal prose.'
  },
  {
    id: 'student',
    name: 'Academic Scholar',
    badge: 'Study & Viva',
    desc: 'Structured breakdowns, step-by-step proofs, viva prep questions, and Socratic hints.'
  },
  {
    id: 'power-user',
    name: 'Power Operator',
    badge: 'High Density',
    desc: 'Compact technical output, shell commands, script automation, and dense summaries.'
  }
];

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { sidebarMode, setSidebarMode, theme, setTheme } = useUiStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [instructions, setInstructions] = useState('');
  const [selectedMode, setSelectedMode] = useState(sidebarMode || 'general');
  const [selectedTheme, setSelectedTheme] = useState(theme || 'dark');
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [brokenLinksNotif, setBrokenLinksNotif] = useState(true);
  const [weeklyDigestNotif, setWeeklyDigestNotif] = useState(true);
  const [remindersNotif, setRemindersNotif] = useState(true);

  // Load current settings from backend
  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        setLoading(true);
        const settings = await fetchSettings();
        if (mounted && settings) {
          setInstructions(settings.globalInstructions || '');
          if (settings.preferences) {
            setSelectedMode(settings.preferences.sidebarMode || 'general');
            setSelectedTheme(settings.preferences.theme || 'dark');
            setStreamingEnabled(settings.preferences.streamingEnabled !== false);
          }
          if (settings.notificationPrefs) {
            setBrokenLinksNotif(settings.notificationPrefs.brokenLinks !== false);
            setWeeklyDigestNotif(settings.notificationPrefs.weeklyDigest !== false);
            setRemindersNotif(settings.notificationPrefs.reminders !== false);
          }
        }
      } catch (err) {
        // Fallback to local store values if network fails
        if (user) {
          setInstructions(user.globalInstructions || '');
          if (user.preferences) {
            setSelectedMode(user.preferences.sidebarMode || sidebarMode || 'general');
            setSelectedTheme(user.preferences.theme || theme || 'dark');
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSettings();
    return () => {
      mounted = false;
    };
  }, [user, sidebarMode, theme]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      const payload = {
        globalInstructions: instructions.trim(),
        preferences: {
          sidebarMode: selectedMode,
          theme: selectedTheme,
          streamingEnabled,
        },
        notificationPrefs: {
          brokenLinks: brokenLinksNotif,
          weeklyDigest: weeklyDigestNotif,
          reminders: remindersNotif,
        }
      };

      const updated = await updateSettings(payload);

      // Sync with client stores
      setSidebarMode(selectedMode);
      setTheme(selectedTheme);
      if (user) {
        setUser({
          ...user,
          ...updated,
          preferences: updated.preferences,
          globalInstructions: updated.globalInstructions,
          notificationPrefs: updated.notificationPrefs,
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.error || err.message || 'Failed to save settings'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleModeSelect = (modeId) => {
    setSelectedMode(modeId);
  };

  return (
    <div className={styles.settings}>
      {/* Page Header */}
      <div className={styles.settings__header}>
        <h2 className={styles.settings__title}>Workspace Settings</h2>
        <p className={styles.settings__description}>
          Configure your Google profile, Gemini system instructions, persona modes, and telemetry preferences.
        </p>
      </div>

      {/* Success / Error Banners */}
      {saveSuccess && (
        <div className={styles.settings__alertSuccess}>
          <span className={styles.settings__alertIcon}>✓</span>
          <span>Preferences saved successfully. Global instructions are active for all new chat sessions.</span>
        </div>
      )}

      {errorMessage && (
        <div className={styles.settings__alertError}>
          <span className={styles.settings__alertIcon}>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Account & Profile Card */}
      <section className={styles.settings__section}>
        <div className={styles.settings__sectionHeader}>
          <h3 className={styles.settings__sectionTitle}>Account Profile</h3>
          <span className={styles.settings__sectionBadge}>Google OAuth Verified</span>
        </div>
        <p className={styles.settings__description}>
          Your primary identity is securely authenticated via Google OAuth 2.0. Profile fields are read-only to preserve security integrity.
        </p>

        <div className={styles.settings__profileCard}>
          <div className={styles.settings__avatarWrapper}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || 'User Avatar'}
                className={styles.settings__avatarImg}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : null}
            <div className={styles.settings__avatarFallback}>
              {(user?.name || user?.email || 'N').charAt(0).toUpperCase()}
            </div>
          </div>

          <div className={styles.settings__profileDetails}>
            <div className={styles.settings__profileNameRow}>
              <span className={styles.settings__profileName}>{user?.name || 'NexAI User'}</span>
              <span className={styles.settings__chipActive}>Active Session</span>
            </div>
            <div className={styles.settings__profileEmail}>{user?.email || 'dev@nexai.app'}</div>
            <div className={styles.settings__profileMeta}>
              Client ID: <code>{user?._id || user?.id || 'session-active'}</code>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Global AI Instructions */}
      <section className={styles.settings__section}>
        <div className={styles.settings__sectionHeader}>
          <h3 className={styles.settings__sectionTitle}>Global System Instructions</h3>
          <span className={styles.settings__sectionTag}>Gemini 2.0 Flash & 2.5 Pro Grounding</span>
        </div>
        <p className={styles.settings__description}>
          Custom instructions prepended to the system prompt across every chat session and document generator run. Use this to enforce formatting rules, coding preferences, or domain constraints.
        </p>

        <div className={styles.settings__field}>
          <div className={styles.settings__textareaHeader}>
            <label htmlFor="globalInstructions" className={styles.settings__label}>
              System Prompt Directive
            </label>
            <span className={styles.settings__charCount}>
              {instructions.length} / 2000 characters
            </span>
          </div>

          <textarea
            id="globalInstructions"
            className={styles.settings__textarea}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Always respond in concise bullet points. Prefer modern ES Modules. For any code samples, include TypeScript types and defensive error handling."
            rows={5}
            maxLength={2000}
          />
        </div>

        {/* Quick Suggestion Chips */}
        <div className={styles.settings__presets}>
          <span className={styles.settings__presetsLabel}>Quick Presets:</span>
          <button
            type="button"
            className={styles.settings__presetBtn}
            onClick={() =>
              setInstructions(
                'You are NexAI, a senior full-stack architect. Prioritize zero-defect designs, secure auth boundaries, and clean modular code with zero boilerplate.'
              )
            }
          >
            Engineering Architect
          </button>
          <button
            type="button"
            className={styles.settings__presetBtn}
            onClick={() =>
              setInstructions(
                'You are an academic mentor and computer science professor. Break concepts down into first principles, explain trade-offs clearly, and format answers for viva exams.'
              )
            }
          >
            Academic Mentor
          </button>
          <button
            type="button"
            className={styles.settings__presetBtn}
            onClick={() => setInstructions('')}
          >
            Clear Directives
          </button>
        </div>
      </section>

      {/* 3. Persona & Sidebar Navigation Mode */}
      <section className={styles.settings__section}>
        <div className={styles.settings__sectionHeader}>
          <h3 className={styles.settings__sectionTitle}>Persona & Workspace Mode</h3>
          <span className={styles.settings__sectionTag}>Navigation Filtering</span>
        </div>
        <p className={styles.settings__description}>
          Select your default operating persona. The sidebar navigation, shortcut recommendations, and tool prioritization will dynamically adapt to this mode.
        </p>

        <div className={styles.settings__personaGrid}>
          {PERSONA_MODES.map((mode) => (
            <div
              key={mode.id}
              className={`${styles.settings__personaCard} ${
                selectedMode === mode.id ? styles['settings__personaCard--selected'] : ''
              }`}
              onClick={() => handleModeSelect(mode.id)}
            >
              <div className={styles.settings__personaCardHeader}>
                <span className={styles.settings__personaCardTitle}>{mode.name}</span>
                <span className={styles.settings__personaBadge}>{mode.badge}</span>
              </div>
              <p className={styles.settings__personaCardDesc}>{mode.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Telemetry & Interface Preferences */}
      <section className={styles.settings__section}>
        <div className={styles.settings__sectionHeader}>
          <h3 className={styles.settings__sectionTitle}>Interface & Streaming Preferences</h3>
        </div>

        <div className={styles.settings__switchRow}>
          <div className={styles.settings__switchInfo}>
            <span className={styles.settings__switchLabel}>Real-Time Token Streaming</span>
            <span className={styles.settings__switchSubtext}>
              Stream Gemini responses incrementally over Server-Sent Events (SSE) with live cursor animation.
            </span>
          </div>
          <label className={styles.settings__toggle}>
            <input
              type="checkbox"
              checked={streamingEnabled}
              onChange={(e) => setStreamingEnabled(e.target.checked)}
            />
            <span className={styles.settings__slider}></span>
          </label>
        </div>

        <div className={styles.settings__switchRow}>
          <div className={styles.settings__switchInfo}>
            <span className={styles.settings__switchLabel}>Color Theme</span>
            <span className={styles.settings__switchSubtext}>
              Switch between High-Contrast Dark Slate and Clean Light workspaces.
            </span>
          </div>
          <div className={styles.settings__themeSelector}>
            <button
              type="button"
              className={`${styles.settings__themeBtn} ${
                selectedTheme === 'dark' ? styles['settings__themeBtn--active'] : ''
              }`}
              onClick={() => setSelectedTheme('dark')}
            >
              🌙 Dark
            </button>
            <button
              type="button"
              className={`${styles.settings__themeBtn} ${
                selectedTheme === 'light' ? styles['settings__themeBtn--active'] : ''
              }`}
              onClick={() => setSelectedTheme('light')}
            >
              ☀️ Light
            </button>
          </div>
        </div>
      </section>

      {/* 5. Notification Toggles */}
      <section className={styles.settings__section}>
        <div className={styles.settings__sectionHeader}>
          <h3 className={styles.settings__sectionTitle}>Automated Health & Notifications</h3>
          <span className={styles.settings__sectionBadge}>Scheduled Cron Tasks</span>
        </div>
        <p className={styles.settings__description}>
          Control automated notifications triggered by background workers and offline indexing tasks.
        </p>

        <div className={styles.settings__switchRow}>
          <div className={styles.settings__switchInfo}>
            <span className={styles.settings__switchLabel}>Broken Link Alerts</span>
            <span className={styles.settings__switchSubtext}>
              Receive notifications when external URLs saved in your Personal Knowledge Library return 404 or become unreachable.
            </span>
          </div>
          <label className={styles.settings__toggle}>
            <input
              type="checkbox"
              checked={brokenLinksNotif}
              onChange={(e) => setBrokenLinksNotif(e.target.checked)}
            />
            <span className={styles.settings__slider}></span>
          </label>
        </div>

        <div className={styles.settings__switchRow}>
          <div className={styles.settings__switchInfo}>
            <span className={styles.settings__switchLabel}>Weekly Knowledge Digest</span>
            <span className={styles.settings__switchSubtext}>
              Get a weekly summarized briefing of newly ingested documents, links, and high-frequency topics.
            </span>
          </div>
          <label className={styles.settings__toggle}>
            <input
              type="checkbox"
              checked={weeklyDigestNotif}
              onChange={(e) => setWeeklyDigestNotif(e.target.checked)}
            />
            <span className={styles.settings__slider}></span>
          </label>
        </div>

        <div className={styles.settings__switchRow}>
          <div className={styles.settings__switchInfo}>
            <span className={styles.settings__switchLabel}>Study & Focus Reminders</span>
            <span className={styles.settings__switchSubtext}>
              Allow spaced repetition and scheduled review reminders for saved learning materials.
            </span>
          </div>
          <label className={styles.settings__toggle}>
            <input
              type="checkbox"
              checked={remindersNotif}
              onChange={(e) => setRemindersNotif(e.target.checked)}
            />
            <span className={styles.settings__slider}></span>
          </label>
        </div>
      </section>

      {/* Save Action Footer */}
      <div className={styles.settings__footer}>
        <button
          type="button"
          className={styles.settings__saveButton}
          onClick={handleSave}
          disabled={saving || loading}
        >
          {saving ? 'Saving Changes...' : 'Save All Preferences'}
        </button>
        <span className={styles.settings__footerHint}>
          Changes are persisted to your profile and immediately take effect.
        </span>
      </div>
    </div>
  );
}
