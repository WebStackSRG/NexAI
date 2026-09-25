import { useState } from 'react';
import PropTypes from 'prop-types';
import { Copy, Check } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import { toast } from '@/store/uiStore';
import styles from './CodeBlock.module.scss';

export function CodeBlock({ language = 'plaintext', value = '' }) {
  const [copied, setCopied] = useState(false);

  const normalizedLang = language.toLowerCase();
  const grammar =
    Prism.languages[normalizedLang] || Prism.languages.javascript || Prism.languages.clike;

  let highlightedCode = '';
  try {
    highlightedCode = Prism.highlight(value, grammar, normalizedLang);
  } catch {
    highlightedCode = value;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.language}>{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className={styles.copyButton}
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check size={14} className={styles.checkIcon} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className={styles.pre}>
        <code
          className={`language-${normalizedLang}`}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </pre>
    </div>
  );
}

CodeBlock.propTypes = {
  language: PropTypes.string,
  value: PropTypes.string.isRequired,
};
