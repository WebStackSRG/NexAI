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
  Bookmark,
  X,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { PromptPickerModal, VariableFillModal } from '@/features/prompts';
import { AttachContextModal } from './AttachContextModal';
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
    isSimulation,
    toggleSimulation,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [attachedContext, setAttachedContext] = useState(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [selectedPromptForVariables, setSelectedPromptForVariables] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const insertCompiledPrompt = (compiledText) => {
    setInput((prev) => (prev ? `${prev}\n\n${compiledText}` : compiledText));
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.value.length;
        textareaRef.current.selectionEnd = textareaRef.current.value.length;
      }
    }, 0);
  };

  const handleSelectPrompt = (prompt) => {
    if (prompt.variables && prompt.variables.length > 0) {
      setSelectedPromptForVariables(prompt);
    } else {
      insertCompiledPrompt(prompt.template);
    }
  };

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
    if ((!trimmed && !attachedContext) || isStreaming || insufficientCredits) {
      return;
    }

    let messageToSend = trimmed;
    if (attachedContext) {
      const contextPrefix = `[Attached Context: ${attachedContext.name} (${attachedContext.type || 'file'})]\n${attachedContext.content ? attachedContext.content.slice(0, 4000) : ''}\n[End of Context]\n\n`;
      messageToSend = `${contextPrefix}${trimmed}`;
    }

    setInput('');
    setAttachedContext(null);
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
      if (
        file.type.startsWith('text/') ||
        file.name.match(/\.(md|txt|json|csv|js|ts|jsx|tsx|py|html|css|yaml|yml)$/i)
      ) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setAttachedContext({
            name: file.name,
            type: 'file',
            content: event.target.result || '',
          });
        };
        reader.readAsText(file);
      } else {
        setAttachedContext({
          name: file.name,
          type: 'file',
          content: `[File attachment: ${file.name}]`,
        });
      }
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

            <button
              type="button"
              className={cn(styles.simPill, isSimulation && styles.activeSimPill)}
              onClick={toggleSimulation}
              disabled={isStreaming}
              title={
                isSimulation
                  ? 'Simulation Mode active (0 Gemini tokens consumed)'
                  : 'Enable Zero-Token Simulation Mode for testing'
              }
            >
              <Zap size={13} className={isSimulation ? styles.activeZap : undefined} />
              <span>{isSimulation ? 'Simulation (0 Tokens)' : 'Simulation'}</span>
            </button>

            {attachedContext && (
              <div className={styles.fileBadge} title={attachedContext.name}>
                {attachedContext.type === 'document' ? (
                  <Bookmark size={12} />
                ) : (
                  <FileText size={12} />
                )}
                <span className={styles.fileName}>
                  {attachedContext.name}
                  {attachedContext.category ? ` (${attachedContext.category})` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => setAttachedContext(null)}
                  className={styles.removeFileBtn}
                  aria-label="Remove attached context"
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
              accept=".txt,.md,.markdown,.json,.csv,.pdf,.js,.ts,.py"
            />
            <IconButton
              type="button"
              icon={<Terminal size={16} />}
              label="Use prompt template"
              variant="ghost"
              size="sm"
              onClick={() => setIsPickerOpen(true)}
              className={styles.toolBtn}
            />
            <IconButton
              type="button"
              icon={<Paperclip size={16} />}
              label="Attach context from file or library"
              variant="ghost"
              size="sm"
              onClick={() => setIsAttachModalOpen(true)}
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
                disabled={(!input.trim() && !attachedContext) || insufficientCredits}
                className={styles.sendButton}
              />
            )}
          </div>
        </div>
      </form>

      {/* Attach Context from Library or Device Modal */}
      <AttachContextModal
        open={isAttachModalOpen}
        onClose={() => setIsAttachModalOpen(false)}
        onSelect={(item) => setAttachedContext(item)}
        onUploadLocal={() => fileInputRef.current?.click()}
      />

      {/* Prompt Selector Modal */}
      <PromptPickerModal
        open={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectPrompt={handleSelectPrompt}
      />

      {/* Variable Fill Modal */}
      {selectedPromptForVariables && (
        <VariableFillModal
          open={Boolean(selectedPromptForVariables)}
          onClose={() => setSelectedPromptForVariables(null)}
          prompt={selectedPromptForVariables}
          onConfirm={insertCompiledPrompt}
          actionLabel="Insert into Chat"
        />
      )}
    </div>
  );
}

ChatInput.propTypes = {
  prefillValue: PropTypes.string,
  onClearPrefill: PropTypes.func,
};
