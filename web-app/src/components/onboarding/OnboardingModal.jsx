import React, { useState } from 'react';
import {
  Compass,
  Code2,
  GraduationCap,
  Zap,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Link2,
} from 'lucide-react';
import useUiStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import apiClient from '../../lib/apiClient';
import styles from './OnboardingModal.module.scss';

const personas = [
  {
    id: 'general',
    label: 'General Assistant',
    desc: 'Conversational chat, everyday document creation, web summaries.',
    icon: Compass,
  },
  {
    id: 'developer',
    label: 'Developer',
    desc: 'Code snippets, JSON & Regex tools, architecture design & API tester.',
    icon: Code2,
  },
  {
    id: 'student',
    label: 'Student / Researcher',
    desc: 'SM-2 flashcards, YouTube lecture summarizer, study goals.',
    icon: GraduationCap,
  },
  {
    id: 'power-user',
    label: 'Power User',
    desc: 'High-volume prompt vault workflows, multi-document synthesis.',
    icon: Zap,
  },
];

const sampleInstructions = [
  'Be concise and return practical code snippets with explanations.',
  'Always format viva study notes with question & answer pairs.',
  'Adopt an executive summary tone with clear bulleted takeaways.',
];

export default function OnboardingModal({ isOpen, onClose }) {
  const { sidebarMode, setSidebarMode } = useUiStore();
  const { user, setUser } = useAuthStore();

  const [step, setStep] = useState(1);
  const [selectedMode, setSelectedMode] = useState(sidebarMode || 'developer');
  const [instructions, setInstructions] = useState('');
  const [seedUrl, setSeedUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFinish = async (skip = false) => {
    setIsSubmitting(true);
    try {
      const payload = {
        onboardingComplete: true,
      };

      if (!skip) {
        payload.preferences = { sidebarMode: selectedMode };
        if (instructions.trim()) {
          payload.globalInstructions = instructions.trim();
        }
      }

      await apiClient.patch('/users/settings', payload);

      if (!skip) {
        setSidebarMode(selectedMode);
        if (seedUrl.trim()) {
          // Trigger initial library save asynchronously
          apiClient
            .post('/library', {
              type: 'url',
              content: seedUrl.trim(),
              title: 'Seed Reference',
            })
            .catch(() => {});
        }
      }

      if (user) {
        setUser({
          ...user,
          onboardingComplete: true,
          preferences: {
            ...(user.preferences || {}),
            sidebarMode: skip ? user.preferences?.sidebarMode : selectedMode,
          },
          globalInstructions: skip ? user.globalInstructions : (instructions.trim() || user.globalInstructions),
        });
      }

      onClose();
    } catch (err) {
      console.error('[Onboarding] Error finishing wizard:', err.message);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <div className={styles.stepIndicator}>Step {step} of 3</div>
            <h2 className={styles.title}>
              {step === 1 && 'Select Your Primary Persona'}
              {step === 2 && 'Set Global AI Instructions'}
              {step === 3 && 'Seed Your Knowledge Library'}
            </h2>
            <p className={styles.subtitle}>
              {step === 1 &&
                'Tailor your NexAI workspace, sidebar shortcuts, and default intelligence.'}
              {step === 2 &&
                'Teach Gemini 2.0 Flash your tone, domain focus, and format preferences.'}
              {step === 3 &&
                'Paste your first article or lecture URL to unlock instant RAG recall.'}
            </p>
          </div>
          <button
            type="button"
            className={styles.skipBtn}
            onClick={() => handleFinish(true)}
          >
            Skip for now
          </button>
        </div>

        {/* Step Contents */}
        <div className={styles.stepContent}>
          {step === 1 && (
            <div className={styles.modeGrid}>
              {personas.map((p) => {
                const Icon = p.icon;
                const isSelected = selectedMode === p.id;

                return (
                  <div
                    key={p.id}
                    className={`${styles.modeCard} ${
                      isSelected ? styles.modeSelected : ''
                    }`}
                    onClick={() => setSelectedMode(p.id)}
                  >
                    <div className={styles.modeIcon}>
                      <Icon size={20} />
                    </div>
                    <div className={styles.modeTitle}>{p.label}</div>
                    <div className={styles.modeDesc}>{p.desc}</div>
                  </div>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className={styles.formGroup}>
              <label>Custom System Prompt Instructions</label>
              <p>These instructions will steer every chat session and document synthesis.</p>
              <textarea
                rows={4}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Always write defensive error boundaries, use TypeScript notation, explain trade-offs clearly..."
              />
              <div className={styles.quickPrompts}>
                {sampleInstructions.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={styles.promptChip}
                    onClick={() => setInstructions(sample)}
                  >
                    + {sample.slice(0, 42)}...
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className={styles.formGroup}>
              <label>Initial Knowledge Resource (Optional)</label>
              <p>
                Provide a technical blog post, documentation page, or lecture URL to
                test Pinecone semantic RAG search.
              </p>
              <input
                type="url"
                value={seedUrl}
                onChange={(e) => setSeedUrl(e.target.value)}
                placeholder="https://react.dev or https://arxiv.org/abs/..."
              />
              <div className={styles.quickPrompts}>
                <button
                  type="button"
                  className={styles.promptChip}
                  onClick={() => setSeedUrl('https://react.dev')}
                >
                  <Link2 size={12} /> React Documentation
                </button>
                <button
                  type="button"
                  className={styles.promptChip}
                  onClick={() =>
                    setSeedUrl('https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API')
                  }
                >
                  <Link2 size={12} /> MDN Web Crypto API
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className={styles.footer}>
          <div className={styles.dots}>
            <span className={`${styles.dot} ${step === 1 ? styles.dotActive : ''}`} />
            <span className={`${styles.dot} ${step === 2 ? styles.dotActive : ''}`} />
            <span className={`${styles.dot} ${step === 3 ? styles.dotActive : ''}`} />
          </div>

          <div className={styles.actions}>
            {step > 1 && (
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setStep(step - 1)}
              >
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                className={styles.nextBtn}
                onClick={() => setStep(step + 1)}
              >
                Next <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                className={styles.nextBtn}
                disabled={isSubmitting}
                onClick={() => handleFinish(false)}
              >
                <Sparkles size={14} />
                {isSubmitting ? 'Configuring...' : 'Launch Workspace'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


