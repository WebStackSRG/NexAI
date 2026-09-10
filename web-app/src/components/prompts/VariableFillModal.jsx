import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, Play } from 'lucide-react';
import usePromptStore from '../../store/promptStore';
import useChatStore from '../../store/chatStore';
import styles from '../../pages/Prompts/PromptsPage.module.scss';

export default function VariableFillModal() {
  const navigate = useNavigate();
  const {
    isFillModalOpen,
    targetPromptForFill,
    closeFillModal,
    executePrompt,
  } = usePromptStore();

  const [values, setValues] = useState({});
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (targetPromptForFill) {
      const initial = {};
      (targetPromptForFill.variables || []).forEach((v) => {
        initial[v] = '';
      });
      setValues(initial);
    }
  }, [targetPromptForFill, isFillModalOpen]);

  if (!isFillModalOpen || !targetPromptForFill) return null;

  const variables = targetPromptForFill.variables || [];

  // Live preview with interpolated variables
  let livePreview = targetPromptForFill.template || '';
  for (const [key, val] of Object.entries(values)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    livePreview = livePreview.replace(regex, val || `{{${key}}}`);
  }

  const handleInputChange = (varName, val) => {
    setValues((prev) => ({
      ...prev,
      [varName]: val,
    }));
  };

  const handleUseInChat = async (e) => {
    e.preventDefault();
    setIsExecuting(true);

    try {
      const result = await executePrompt(
        targetPromptForFill._id || targetPromptForFill.id,
        values
      );

      closeFillModal();

      // Navigate to /chat with pre-filled message draft
      navigate('/chat', {
        state: {
          draftMessage: result.filledPrompt,
          autoFocus: true,
        },
      });
    } catch (err) {
      console.error('Failed to execute prompt:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={closeFillModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modal__header}>
          <div className={styles.modal__titleWrap}>
            <Play size={18} color="var(--color-accent)" />
            <h3>Use Prompt: {targetPromptForFill.title}</h3>
          </div>
          <button type="button" onClick={closeFillModal} className={styles.modal__closeBtn}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleUseInChat} className={styles.modal__form}>
          {variables.length === 0 ? (
            <p className={styles.modal__hint}>
              This prompt has no dynamic variables. It will be injected directly into a new chat conversation.
            </p>
          ) : (
            <div className={styles.modal__variablesGrid}>
              {variables.map((varName) => (
                <div key={varName} className={styles.modal__field}>
                  <label className={styles.modal__label}>
                    Variable: <code>&#123;&#123;{varName}&#125;&#125;</code>
                  </label>
                  <input
                    type="text"
                    value={values[varName] || ''}
                    onChange={(e) => handleInputChange(varName, e.target.value)}
                    placeholder={`Enter value for ${varName}...`}
                    className={styles.modal__input}
                    required
                  />
                </div>
              ))}
            </div>
          )}

          {/* Interpolated Live Preview */}
          <div className={styles.modal__field}>
            <label className={styles.modal__label}>Interpolated Preview</label>
            <div className={styles.modal__previewBox}>
              <pre>{livePreview}</pre>
            </div>
          </div>

          <div className={styles.modal__footer}>
            <button
              type="button"
              onClick={closeFillModal}
              className={styles.modal__cancelBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isExecuting}
              className={styles.modal__submitBtn}
            >
              <Send size={14} />
              <span>{isExecuting ? 'Injecting...' : 'Launch in Chat'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
