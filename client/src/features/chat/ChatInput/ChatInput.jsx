import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, Square, Zap, Sparkles, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils/cn';
import styles from './ChatInput.module.scss';

export function ChatInput({ prefillValue, onClearPrefill }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const {
    sendMessage,
    isStreaming,
    stopGeneration,
    insufficientCredits,
    selectedModel,
    setSelectedModel,
  } = useChatStore();

  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  // Initialize model from user settings if available
  useEffect(() => {
    if (user?.settings?.defaultModel) {
      setSelectedModel(user.settings.defaultModel);
    }
  }, [user?.settings?.defaultModel, setSelectedModel]);

  // Handle external prefill (e.g. from prompt vault or suggestion chips)
  useEffect(() => {
    if (prefillValue) {
      setInput(prefillValue);
      onClearPrefill?.();
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [prefillValue, onClearPrefill]);

  // Adjust height of textarea dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming || insufficientCredits) {
      return;
    }
    const messageToSend = input;
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await sendMessage(messageToSend);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleRecharge = () => {
    navigate(ROUTES.WALLET);
  };

  return (
    <div className={styles.inputContainer}>
      {insufficientCredits && (
        <div className={styles.insufficientBanner} role="alert">
          <div className={styles.bannerInfo}>
            <Zap size={16} className={styles.bannerIcon} />
            <span>You have run out of credits. Recharge your wallet to continue chatting.</span>
          </div>
          <Button variant="primary" size="sm" onClick={handleRecharge}>
            Recharge to continue
          </Button>
        </div>
      )}

      <form className={styles.composerForm} onSubmit={handleSubmit}>
        <div className={styles.toolbar}>
          <div className={styles.modelSelector}>
            <button
              type="button"
              className={cn(styles.modelPill, selectedModel === 'flash' && styles.activeModel)}
              onClick={() => setSelectedModel('flash')}
              disabled={isStreaming}
              title="Gemini Flash (fast and cost-effective)"
            >
              <Sparkles size={14} />
              <span>Flash</span>
            </button>
            <button
              type="button"
              className={cn(styles.modelPill, selectedModel === 'pro' && styles.activeModel)}
              onClick={() => setSelectedModel('pro')}
              disabled={isStreaming}
              title="Gemini Pro (deep reasoning and complex tasks)"
            >
              <Cpu size={14} />
              <span>Pro</span>
            </button>
          </div>
        </div>

        <div className={styles.inputRow}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={insufficientCredits}
            placeholder={
              insufficientCredits
                ? 'Recharge your credits to send messages...'
                : 'Message NexAI... (Enter to send, Shift + Enter for new line)'
            }
            className={styles.textarea}
            aria-label="Chat input message"
          />

          <div className={styles.submitWrapper}>
            {isStreaming ? (
              <IconButton
                icon={<Square size={16} fill="currentColor" />}
                label="Stop generating"
                variant="secondary"
                size="md"
                onClick={stopGeneration}
                className={styles.stopButton}
              />
            ) : (
              <IconButton
                type="submit"
                icon={<ArrowUp size={18} />}
                label="Send message"
                variant="primary"
                size="md"
                disabled={!input.trim() || insufficientCredits}
                className={styles.sendButton}
              />
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

ChatInput.propTypes = {
  prefillValue: PropTypes.string,
  onClearPrefill: PropTypes.func,
};
