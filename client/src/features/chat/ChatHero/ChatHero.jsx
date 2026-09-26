import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Sparkles,
  Cpu,
  Mic,
  MicOff,
  Paperclip,
  ArrowUp,
  X,
  FileText,
  HelpCircle,
  Code2,
  Mail,
  Server,
  ChevronDown,
} from 'lucide-react';
import { Dropdown } from '@/components/ui/Dropdown';
import { IconButton } from '@/components/ui/IconButton';
import { useChatStore } from '@/store/chatStore';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { cn } from '@/lib/utils/cn';
import styles from './ChatHero.module.scss';

const STARTER_PROMPTS = [
  {
    icon: <HelpCircle size={18} />,
    title: 'Explain a Concept',
    prompt: 'Explain quantum computing in simple, intuitive terms.',
  },
  {
    icon: <Code2 size={18} />,
    title: 'Code Assistance',
    prompt: 'Write a Python script to parse and transform a CSV dataset.',
  },
  {
    icon: <Mail size={18} />,
    title: 'Professional Writing',
    prompt: 'Draft a polite follow-up email after a job interview.',
  },
  {
    icon: <Server size={18} />,
    title: 'System Architecture',
    prompt: 'Design a scalable caching strategy for an API using Redis.',
  },
];

export function ChatHero({ onSendPrompt }) {
  const { selectedModel, setSelectedModel, insufficientCredits, isStreaming } = useChatStore();

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

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
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
      textareaRef.current.style.height = 'auto';
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
    // Reset file input so re-selecting same file triggers change
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

  return (
    <div className={styles.heroContainer} data-testid="chat-hero">
      <div className={styles.heroContent}>
        {/* Gemini-inspired Hero Headline */}
        <div className={styles.greetingHeader}>
          <div className={styles.sparkleIcon}>
            <Sparkles size={28} />
          </div>
          <h1 className={styles.heroHeadline}>Where should we start?</h1>
          <p className={styles.heroSubtitle}>
            Select a model, type a prompt, or use starter suggestions to begin.
          </p>
        </div>

        {/* Glowing Floating Input Bar */}
        <div className={styles.glowingInputCard}>
          {/* Top Bar inside Input: Model Selector & Attached File */}
          <div className={styles.cardHeader}>
            <Dropdown
              trigger={
                <button
                  type="button"
                  className={styles.modelTrigger}
                  aria-label="Select AI Model"
                >
                  <span className={styles.modelIcon}>
                    {selectedModel === 'pro' ? <Cpu size={14} /> : <Sparkles size={14} />}
                  </span>
                  <span className={styles.modelName}>
                    {selectedModel === 'pro' ? 'Gemini 3.1 Pro' : 'Gemini 3.8 Flash'}
                  </span>
                  <ChevronDown size={13} className={styles.chevron} />
                </button>
              }
              items={modelMenuItems}
              align="left"
            />

            {attachedFile && (
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
            )}
          </div>

          {/* Main Textarea */}
          <form onSubmit={handleSubmit} className={styles.composerForm}>
            <textarea
              ref={textareaRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={insufficientCredits}
              placeholder={
                insufficientCredits
                  ? 'Recharge your credits to send messages...'
                  : 'Ask NexAI anything... (Enter to send, Shift + Enter for new line)'
              }
              className={styles.textarea}
              aria-label="Ask NexAI anything"
            />

            {/* Bottom Actions Row */}
            <div className={styles.cardFooter}>
              <div className={styles.leftTools}>
                {/* File context attachment trigger */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  aria-label="Attach file"
                />
                <IconButton
                  type="button"
                  icon={<Paperclip size={17} />}
                  label="Attach context file"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className={styles.toolBtn}
                />

                {/* Web Speech API Voice Dictation Button */}
                <IconButton
                  type="button"
                  icon={
                    isListening ? (
                      <MicOff size={17} className={styles.activeMicIcon} />
                    ) : (
                      <Mic size={17} />
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

              {/* Submit button */}
              <div className={styles.rightTools}>
                <IconButton
                  type="submit"
                  icon={<ArrowUp size={18} />}
                  label="Send prompt"
                  variant="primary"
                  size="md"
                  disabled={(!input.trim() && !attachedFile) || insufficientCredits}
                  className={styles.sendBtn}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Starter Prompt Suggestion Chips */}
        <div className={styles.chipsSection} aria-label="Suggested starter prompts">
          {STARTER_PROMPTS.map((item, index) => (
            <button
              key={index}
              type="button"
              className={styles.promptChip}
              onClick={() => handleSelectChip(item.prompt)}
              aria-label={item.title}
            >
              <div className={styles.chipIcon}>{item.icon}</div>
              <div className={styles.chipText}>
                <span className={styles.chipTitle}>{item.title}</span>
                <span className={styles.chipPrompt}>{item.prompt}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

ChatHero.propTypes = {
  onSendPrompt: PropTypes.func,
};
