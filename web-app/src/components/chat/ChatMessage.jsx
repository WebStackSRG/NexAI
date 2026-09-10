import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Copy, Check, Sparkles, Clock, BookOpen, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import styles from './ChatMessage.module.scss';

function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy to clipboard', err);
    }
  };

  return (
    <div className={styles.message__codeBlock}>
      <div className={styles.message__codeHeader}>
        <span>{language || 'text'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className={styles.message__copyBtn}
          title="Copy snippet"
        >
          {copied ? (
            <>
              <Check size={12} color="var(--color-success)" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className={styles.message__codeContent}>
        <code>{value}</code>
      </pre>
    </div>
  );
}

export default function ChatMessage({
  role = 'assistant',
  content = '',
  sources = [],
  toolCalls = [],
  isStreaming = false,
  model = 'gemini-2.0-flash',
  latencyMs,
  createdAt,
  userName = 'You',
  userAvatar,
}) {
  const isUser = role === 'user';
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const resolvedSources =
    sources && sources.length > 0
      ? sources
      : toolCalls?.find((t) => t.name === 'rag_knowledge_retrieval')?.output?.sources || [];

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={`${styles.message} ${
        isUser ? styles['message--user'] : styles['message--assistant']
      }`}
    >
      <div className={styles.message__avatar}>
        {isUser ? (
          userAvatar ? (
            <img src={userAvatar} alt={userName} />
          ) : (
            <User size={16} />
          )
        ) : (
          <Bot size={16} />
        )}
      </div>

      <div className={styles.message__bubble}>
        <div className={styles.message__header}>
          <span className={styles.message__author}>
            {isUser ? userName : 'NexAI'}
          </span>
          <div className={styles.message__meta}>
            {!isUser && model && (
              <span className={styles.message__badge}>
                <Sparkles size={10} style={{ display: 'inline', marginRight: 3 }} />
                {model}
              </span>
            )}
            {!isUser && latencyMs > 0 && (
              <span>
                <Clock size={10} style={{ display: 'inline', marginRight: 2 }} />
                {latencyMs}ms
              </span>
            )}
            {createdAt && <span>{formatTime(createdAt)}</span>}
          </div>
        </div>

        <div className={styles.message__body}>
          {isUser ? (
            <p>{content}</p>
          ) : (
            <>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeText = String(children).replace(/\n$/, '');

                    if (!inline && (match || codeText.includes('\n'))) {
                      return (
                        <CodeBlock
                          language={match ? match[1] : ''}
                          value={codeText}
                        />
                      );
                    }
                    return (
                      <code className={styles.message__inlineCode} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
              {isStreaming && <span className={styles.message__cursor}>▌</span>}
            </>
          )}
        </div>

        {!isUser && resolvedSources.length > 0 && (
          <div className={styles.message__sourcesPanel}>
            <button
              type="button"
              onClick={() => setSourcesOpen(!sourcesOpen)}
              className={styles.message__sourcesToggle}
            >
              <BookOpen size={13} color="var(--color-accent)" />
              <span>Grounded Sources</span>
              <span className={styles.message__sourcesCount}>
                {resolvedSources.length} citations
              </span>
              {sourcesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {sourcesOpen && (
              <div className={styles.message__sourcesList}>
                {resolvedSources.map((source, idx) => (
                  <div key={source.id || idx} className={styles.message__sourceCard}>
                    <div className={styles.message__sourceHeader}>
                      <span className={styles.message__sourceTitle}>
                        <FileText size={12} color="var(--text-tertiary)" />
                        {source.title}
                      </span>
                      <span className={styles.message__sourceScore}>
                        {source.score}% match
                      </span>
                    </div>
                    {source.snippet && (
                      <p className={styles.message__sourceSnippet}>
                        {source.snippet}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
