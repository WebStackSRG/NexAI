import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Plus,
  Mic,
  MicOff,
  ArrowUp,
  X,
  FileText,
  HelpCircle,
  Code2,
  Mail,
  Server,
  ChevronDown,
  Sparkles,
  Cpu,
  Terminal,
} from 'lucide-react';
import { Dropdown } from '@/components/ui/Dropdown';
import { IconButton } from '@/components/ui/IconButton';
import { PromptPickerModal, VariableFillModal } from '@/features/prompts';
import { useChatStore } from '@/store/chatStore';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { cn } from '@/lib/utils/cn';
import styles from './ChatHero.module.scss';


const STARTER_PROMPTS = [
  {
    icon: <HelpCircle size={17} />,
    title: 'Explain a Concept',
    prompt: 'Explain quantum computing in simple, intuitive terms.',
  },
  {
    icon: <Code2 size={17} />,
    title: 'Code Assistance',
    prompt: 'Write a Python script to parse and transform a CSV dataset.',
  },
  {
    icon: <Mail size={17} />,
    title: 'Professional Writing',
    prompt: 'Draft a polite follow-up email after a job interview.',
  },
  {
    icon: <Server size={17} />,
    title: 'System Architecture',
    prompt: 'Design a scalable caching strategy for an API using Redis.',
  },
];

export function ChatHero({ onSendPrompt, initialPrompt, onClearInitialPrompt }) {
  const { selectedModel, setSelectedModel, insufficientCredits, isStreaming } = useChatStore();

  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
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

  // Handle external prefill from Prompt Vault
  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
      onClearInitialPrompt?.();
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [initialPrompt, onClearInitialPrompt]);

  // Web Speech API Voice Dictation Hook
  const { isSupported: isVoiceSupported, isListening, toggleListening } = useSpeechRecognition({
    onResult: (transcription) => {
      setInput((prev) => (prev ? `${prev} ${transcription}` : transcription));
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    },
  });


  // Adjust textarea height dynamically if multiline, default to single-line
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      if (scrollH > 40) {
        textareaRef.current.style.height = `${Math.min(scrollH, 120)}px`;
      } else {
        textareaRef.current.style.height = '24px';
      }
    }
  }, [input]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if ((!trimmed && !attachedFile) || isStreaming || insufficientCredits) {
      return;
    }

    let finalPrompt = trimmed;
    if (attachedFile) {
      finalPrompt = `[Context File: ${attachedFile.name}]\n\n${trimmed}`;
    }

    setInput('');
    setAttachedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
    }

    if (onSendPrompt) {
      onSendPrompt(finalPrompt);
    }
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

  const handleSelectChip = (promptText) => {
    if (isStreaming || insufficientCredits) return;
    if (onSendPrompt) {
      onSendPrompt(promptText);
    } else {
      setInput(promptText);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const modelMenuItems = [
    {
      label: 'Gemini 3.8 Flash (Fast & Cost-Effective)',
      icon: <Sparkles size={15} />,
      onClick: () => setSelectedModel('flash'),
    },
    {
      label: 'Gemini 3.1 Pro (Deep Reasoning & Analysis)',
      icon: <Cpu size={15} />,
      onClick: () => setSelectedModel('pro'),
    },
  ];

  const hasContent = Boolean(input.trim() || attachedFile);

  return (
    <div className={styles.heroContainer} data-testid="chat-hero">
      <div className={styles.heroContent}>
        {/* Gemini-inspired Hero Headline */}
        <div className={styles.greetingHeader}>
          <div className={styles.sparkleIcon}>
            <Sparkles size={24} />
          </div>
          <h1 className={styles.heroHeadline}>Where should we start?</h1>
          <p className={styles.heroSubtitle}>
            Select a model, type a prompt, or use starter suggestions to begin.
          </p>
        </div>

        {/* Floating attached file badge if any */}
        {attachedFile && (
          <div className={styles.fileBadgeRow}>
            <div className={styles.fileBadge} title={attachedFile.name}>
              <FileText size={13} />
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
          </div>
        )}

        {/* Gemini One-Liner Pill Capsule Input */}
        <div className={styles.composerCapsule}>
          <form onSubmit={handleSubmit} className={styles.composerForm}>
            {/* Left '+' Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              aria-label="Attach file"
            />
            <IconButton
              type="button"
              icon={<Plus size={18} />}
              label="Attach context file"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className={styles.attachBtn}
            />

            {/* Center Input Field */}
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
                  : 'Ask NexAI anything...'
              }
              className={styles.inputField}
              aria-label="Ask NexAI anything"
            />

            {/* Right Controls: Model Selector + Mic + Send */}
            <div className={styles.rightControls}>
              <Dropdown
                trigger={
                  <button
                    type="button"
                    className={styles.modelTrigger}
                    aria-label="Select AI Model"
                  >
                    <span className={styles.modelName}>
                      {selectedModel === 'pro' ? 'Gemini 3.1 Pro' : 'Gemini 3.8 Flash'}
                    </span>
                    <ChevronDown size={13} className={styles.chevron} />
                  </button>
                }
                items={modelMenuItems}
                align="right"
              />

              <IconButton
                type="button"
                icon={<Terminal size={15} />}
                label="Use prompt template"
                variant="ghost"
                size="sm"
                onClick={() => setIsPickerOpen(true)}
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

              {hasContent && (
                <IconButton
                  type="submit"
                  icon={<ArrowUp size={16} />}
                  label="Send prompt"
                  variant="primary"
                  size="sm"
                  disabled={!hasContent || insufficientCredits}
                  className={styles.sendBtn}
                />
              )}
            </div>
          </form>
        </div>

        {/* Minimalist Gemini Quick Prompts (clean text rows, not cards) */}
        <div className={styles.quickPromptsList} aria-label="Suggested starter prompts">
          {STARTER_PROMPTS.map((item, index) => (
            <button
              key={index}
              type="button"
              className={styles.quickPromptRow}
              onClick={() => handleSelectChip(item.prompt)}
              aria-label={item.title}
            >
              <span className={styles.promptIcon}>{item.icon}</span>
              <span className={styles.promptText}>{item.prompt}</span>
              <span className={styles.promptCategory}>{item.title}</span>
            </button>
          ))}
        </div>
      </div>

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
          actionLabel="Use in Chat"
        />
      )}
    </div>
  );
}

ChatHero.propTypes = {
  onSendPrompt: PropTypes.func,
  initialPrompt: PropTypes.string,
  onClearInitialPrompt: PropTypes.func,
};

