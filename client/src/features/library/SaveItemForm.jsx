import { useState } from 'react';
import { Globe, FileText, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils/cn';
import styles from './SaveItemForm.module.scss';

export function SaveItemForm({ onSuggest, isSuggesting, error }) {
  const [type, setType] = useState('link');
  const [url, setUrl] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTitleHint, setNoteTitleHint] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (type === 'link') {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) {
        setValidationError('Please enter a website URL');
        return;
      }
      try {
        const parsed = new URL(trimmedUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          setValidationError('URL must start with http:// or https://');
          return;
        }
      } catch {
        setValidationError('Please enter a valid web URL');
        return;
      }

      onSuggest({ type: 'link', url: trimmedUrl });
    } else {
      const trimmed = noteContent.trim();
      if (!trimmed) {
        setValidationError('Please enter note content');
        return;
      }
      if (trimmed.length < 5) {
        setValidationError('Note content should be at least 5 characters');
        return;
      }

      onSuggest({
        type: 'note',
        content: trimmed,
        suggestedTitle: noteTitleHint.trim(),
      });
    }
  };

  if (isSuggesting) {
    return (
      <div className={styles.loadingBox}>
        <Spinner size="lg" />
        <div className={styles.loadingText}>
          {type === 'link'
            ? 'Fetching webpage and analyzing content...'
            : 'Analyzing notes with Gemini...'}
        </div>
        <div className={styles.loadingSubtext}>
          Generating descriptive title, concise summary, and smart tags.
        </div>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.typeSelector} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={type === 'link'}
          className={cn(styles.typeBtn, type === 'link' && styles.active)}
          onClick={() => {
            setType('link');
            setValidationError('');
          }}
        >
          <Globe size={16} />
          Web Link
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={type === 'note'}
          className={cn(styles.typeBtn, type === 'note' && styles.active)}
          onClick={() => {
            setType('note');
            setValidationError('');
          }}
        >
          <FileText size={16} />
          Note / Text
        </button>
      </div>

      {(validationError || error) && (
        <div className={styles.errorBanner}>{validationError || error}</div>
      )}

      {type === 'link' ? (
        <div className={styles.inputGroup}>
          <Input
            label="Page URL"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            leftIcon={<Globe size={16} />}
            autoFocus
          />
          <div className={styles.hint}>
            NexAI will fetch the article content and auto-generate title, summary, and tags.
          </div>
        </div>
      ) : (
        <div className={styles.inputGroup}>
          <Input
            label="Title Hint (Optional)"
            type="text"
            value={noteTitleHint}
            onChange={(e) => setNoteTitleHint(e.target.value)}
            placeholder="e.g. Docker commands cheat sheet"
          />
          <Textarea
            label="Note or Snippet Content"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Paste your notes, thoughts, code snippets, or documentation..."
            rows={5}
            autoFocus
          />
          <div className={styles.hint}>
            NexAI will analyze your text to create structured metadata and make it semantically
            searchable.
          </div>
        </div>
      )}

      <Button type="submit" variant="primary" fullWidth leftIcon={<Sparkles size={16} />}>
        Suggest Title & Tags
      </Button>
    </form>
  );
}
