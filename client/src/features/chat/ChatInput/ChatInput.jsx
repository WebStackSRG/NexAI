import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUp,
  Square,
  Zap,
  Sparkles,
  Cpu,
  Mic,
  MicOff,
  Paperclip,
  FileText,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
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
  const [attachedFile, setAttachedFile] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Web Speech API Voice Dictation Hook
  const { isSupported: isVoiceSupported, isListening, toggleListening } = useSpeechRecognition({
    onResult: (transcription) => {
      setInput((prev) => (prev ? `${prev} ${transcription}` : transcription));
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    },
  });

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
    const trimmed = input.trim();
    if ((!trimmed && !attachedFile) || isStreaming || insufficientCredits) {
      return;
    }

    let messageToSend = trimmed;
    if (attachedFile) {
      messageToSend = `[Context File: ${attachedFile.name}]\n\n${trimmed}`;
    }

    setInput('');
    setAttachedFile(null);
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
          <div className={styles.leftToolbar}>
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

            {attachedFile && (
              <div className={styles.fileBadge} title={attachedFile.name}>
                <FileText size={12} />
                <span className={styles.fileName}>{attachedFile.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className={styles.removeFileBtn}
                  aria-label="Remove attached file"
                >
                  <X size={11} />
                </button>
              </div>
            )}
          </div>

          <div className={styles.rightToolbar}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              aria-label="Attach file"
            />
            <IconButton
              type="button"
              icon={<Paperclip size={16} />}
              label="Attach context file"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className={styles.toolBtn}
            />
            <IconButton
              type="button"
              icon={
                isListening ? (
                  <MicOff size={16} className={styles.activeMicIcon} />
                ) : (
                  <Mic size={16} />
                )
              }
              label={
                !isVoiceSupported
                  ? 'Voice input not supported in this browser'
                  : isListening
                    ? 'Stop listening'
                    : 'Voice dictation'
              }
              disabled={!isVoiceSupported}
              variant={isListening ? 'primary' : 'ghost'}
              size="sm"
              onClick={toggleListening}
              className={cn(styles.toolBtn, isListening && styles.listeningMic)}
            />
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
                disabled={(!input.trim() && !attachedFile) || insufficientCredits}
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
