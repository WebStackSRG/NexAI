import { useRef, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Sparkles,
  ArrowDown,
  Square,
  Copy,
  Check,
  RotateCcw,
  Edit3,
  AlertCircle,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { toast } from '@/store/uiStore';
import { cn } from '@/lib/utils/cn';
import styles from './MessageThread.module.scss';

const PROMPT_SUGGESTIONS = [
  {
    title: 'Explain a Concept',
    description: 'Explain quantum computing in simple, intuitive terms.',
  },
  {
    title: 'Code Assistance',
    description: 'Write a Python script to parse and transform a CSV dataset.',
  },
  {
    title: 'Professional Writing',
    description: 'Draft a polite follow-up email after a job interview.',
  },
  {
    title: 'System Architecture',
    description: 'Design a scalable caching strategy for an API using Redis.',
  },
];

function formatTime(timestamp) {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function MessageThread({ onSelectSuggestion, onEditPrompt }) {
  const user = useAuthStore((state) => state.user);
  const {
    messages,
    isLoadingMessages,
    isStreaming,
    stopGeneration,
    resendPrompt,
  } = useChatStore();

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const userScrolledUpRef = useRef(false);

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleResendUserPrompt = (content) => {
    if (isStreaming) return;
    resendPrompt(content);
  };

  const handleRetryAssistant = (index) => {
    if (isStreaming) return;
    // Find closest preceding user message
    const precedingUserMsg = messages
      .slice(0, index)
      .reverse()
      .find((m) => m.role === 'user');

    if (precedingUserMsg?.content) {
      resendPrompt(precedingUserMsg.content);
    }
  };

  // Check scroll position to determine if auto-scroll should happen
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    userScrolledUpRef.current = !isNearBottom;
    setShowScrollBottom(!isNearBottom);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    }
  }, []);

  // Auto-scroll when messages update, unless user scrolled up
  useEffect(() => {
    if (!userScrolledUpRef.current) {
      scrollToBottom(false);
    }
  }, [messages, scrollToBottom]);

  // When a new stream begins, scroll to bottom
  useEffect(() => {
    if (isStreaming) {
      userScrolledUpRef.current = false;
      scrollToBottom(true);
    }
  }, [isStreaming, scrollToBottom]);

  return (
    <div className={styles.threadContainer}>
      <div
        ref={containerRef}
        className={styles.scrollArea}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-label="Message history"
      >
        {isLoadingMessages ? (
          <div className={styles.loadingList}>
            <div className={styles.skeletonMessageUser}>
              <Skeleton width="50%" height="56px" radius="lg" />
            </div>
            <div className={styles.skeletonMessageAi}>
              <Skeleton width="75%" height="110px" radius="lg" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyWelcome}>
            <div className={styles.welcomeIcon}>
              <Sparkles size={32} />
            </div>
            <h2 className={styles.welcomeTitle}>What can I help you with today?</h2>
            <p className={styles.welcomeSubtitle}>
              NexAI is ready to brainstorm, code, analyze, and draft with metered precision.
            </p>

            <div className={styles.suggestionsGrid}>
              {PROMPT_SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.suggestionCard}
                  onClick={() => onSelectSuggestion?.(item.description)}
                >
                  <span className={styles.suggestionTitle}>{item.title}</span>
                  <span className={styles.suggestionDesc}>{item.description}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.messageList}>
            {messages.map((message, index) => {
              const isUser = message.role === 'user';
              const isLast = index === messages.length - 1;
              const isCurrentlyStreaming = isLast && isStreaming && !isUser;
              const hasError = Boolean(message.error);
              const messageId = message._id || `msg-${index}`;
              const isCopied = copiedId === messageId;
              const timeString = formatTime(message.createdAt);

              return (
                <div
                  key={messageId}
                  className={cn(
                    styles.messageRow,
                    isUser ? styles.userRow : styles.assistantRow,
                  )}
                >
                  <div className={styles.avatarWrapper}>
                    {isUser ? (
                      <Avatar name={user?.email || 'User'} size="sm" />
                    ) : (
                      <div className={styles.aiAvatar}>
                        <Sparkles size={16} />
                      </div>
                    )}
                  </div>

                  <div className={styles.messageContentWrapper}>
                    <div className={styles.metaHeader}>
                      <span className={styles.senderName}>
                        {isUser ? 'You' : 'NexAI'}
                      </span>
                      {timeString && (
                        <span className={styles.timestamp}>{timeString}</span>
                      )}
                      {message.tokensUsed ? (
                        <Badge tone="neutral" className={styles.tokenBadge}>
                          ⚡ {message.tokensUsed} tokens
                        </Badge>
                      ) : null}
                    </div>

                    <div
                      className={cn(
                        styles.bubble,
                        isUser ? styles.userBubble : styles.assistantBubble,
                        hasError && styles.errorBubble,
                      )}
                    >
                      {isUser ? (
                        <div className={styles.userText}>{message.content}</div>
                      ) : isCurrentlyStreaming && !message.content ? (
                        <div className={styles.typingIndicator} aria-label="Thinking...">
                          <span className={styles.dot} />
                          <span className={styles.dot} />
                          <span className={styles.dot} />
                        </div>
                      ) : hasError ? (
                        <div className={styles.errorCard}>
                          <div className={styles.errorContent}>
                            <AlertCircle size={16} className={styles.errorIcon} />
                            <span>{message.error}</span>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<RotateCcw size={13} />}
                            onClick={() => handleRetryAssistant(index)}
                            disabled={isStreaming}
                            className={styles.retryButton}
                          >
                            Retry
                          </Button>
                        </div>
                      ) : (
                        <div className={styles.aiMarkdown}>
                          <MarkdownRenderer content={message.content} />
                          {isCurrentlyStreaming && (
                            <span className={styles.blinkingCursor} aria-hidden="true" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Bar on hover */}
                    {!isCurrentlyStreaming && (
                      <div className={styles.actionToolbar}>
                        {isUser ? (
                          <>
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() => handleCopy(message.content, messageId)}
                              title="Copy prompt"
                              aria-label="Copy prompt"
                            >
                              {isCopied ? <Check size={13} className={styles.copiedIcon} /> : <Copy size={13} />}
                              <span>{isCopied ? 'Copied' : 'Copy'}</span>
                            </button>
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() => onEditPrompt?.(message.content)}
                              title="Edit prompt in input box"
                              aria-label="Edit prompt in input box"
                            >
                              <Edit3 size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() => handleResendUserPrompt(message.content)}
                              title="Resend this prompt"
                              aria-label="Resend this prompt"
                              disabled={isStreaming}
                            >
                              <RotateCcw size={13} />
                              <span>Resend</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() => handleCopy(message.content, messageId)}
                              title="Copy response"
                              aria-label="Copy response"
                            >
                              {isCopied ? <Check size={13} className={styles.copiedIcon} /> : <Copy size={13} />}
                              <span>{isCopied ? 'Copied' : 'Copy'}</span>
                            </button>
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() => handleRetryAssistant(index)}
                              title="Regenerate response"
                              aria-label="Regenerate response"
                              disabled={isStreaming}
                            >
                              <RotateCcw size={13} />
                              <span>Regenerate</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Floating control buttons */}
      <div className={styles.floatingControls}>
        {isStreaming && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Square size={14} fill="currentColor" />}
            onClick={stopGeneration}
            className={styles.stopButton}
          >
            Stop generating
          </Button>
        )}

        {showScrollBottom && (
          <button
            type="button"
            className={styles.scrollDownButton}
            onClick={() => scrollToBottom(true)}
            aria-label="Scroll to bottom"
          >
            <ArrowDown size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

MessageThread.propTypes = {
  onSelectSuggestion: PropTypes.func,
  onEditPrompt: PropTypes.func,
};
