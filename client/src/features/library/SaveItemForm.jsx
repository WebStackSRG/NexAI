import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Globe, FileText, Sparkles, Check } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { NoteEditor } from './NoteEditor';
import { cn } from '@/lib/utils/cn';
import styles from './SaveItemForm.module.scss';

export function SaveItemForm({
  onSuggest,
  onDirectSave,
  isSuggesting,
  isSaving,
  error,
  prefill = null,
}) {
  const [type, setType] = useState(prefill?.type || 'link');
  const [url, setUrl] = useState(prefill?.url || '');
  const [noteContent, setNoteContent] = useState(prefill?.content || '');
  const [noteTitleHint, setNoteTitleHint] = useState(prefill?.title || '');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (prefill) {
      if (prefill.type) setType(prefill.type);
      if (prefill.url) setUrl(prefill.url);
      if (prefill.content) setNoteContent(prefill.content);
      if (prefill.title) setNoteTitleHint(prefill.title);
    }
  }, [prefill]);


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

  const handleDirectSaveNote = (e) => {
    e.preventDefault();
    setValidationError('');

    const trimmed = noteContent.trim();
    if (!trimmed) {
      setValidationError('Please enter note content');
      return;
    }

    // Auto title if not specified
    const title =
      noteTitleHint.trim() ||
      trimmed.split('\n')[0].replace(/^#+\s*/, '').slice(0, 50) ||
      'Untitled Note';

    onDirectSave?.({
      type: 'note',
      title,
      content: trimmed,
      summary: trimmed.slice(0, 150) + (trimmed.length > 150 ? '...' : ''),
      tags: prefill?.tags || [],
    });
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
          <Button type="submit" variant="primary" fullWidth leftIcon={<Sparkles size={16} />}>
            Suggest Title & Tags
          </Button>
        </div>
      ) : (
        <div className={styles.inputGroup}>
          <Input
            label="Note Title (Optional)"
            type="text"
            value={noteTitleHint}
            onChange={(e) => setNoteTitleHint(e.target.value)}
            placeholder="e.g. Architecture decisions, API cheatsheet..."
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className={styles.label}>Note Content (Interactive Markdown)</span>
            <NoteEditor
              value={noteContent}
              onChange={setNoteContent}
              placeholder="Write your note with rich markdown formatting, code snippets, lists, and quotes..."
              minHeight={200}
              autoFocus
            />
          </div>

          <div className={styles.buttonRow}>
            <Button
              type="button"
              variant="secondary"
              onClick={handleDirectSaveNote}
              loading={isSaving}
              leftIcon={<Check size={16} />}
              style={{ flex: 1 }}
            >
              Save Directly
            </Button>
            <Button
              type="submit"
              variant="primary"
              leftIcon={<Sparkles size={16} />}
              style={{ flex: 1.2 }}
            >
              AI Suggest & Tags
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}

SaveItemForm.propTypes = {
  onSuggest: PropTypes.func.isRequired,
  onDirectSave: PropTypes.func,
  isSuggesting: PropTypes.bool,
  isSaving: PropTypes.bool,
  error: PropTypes.string,
  prefill: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    content: PropTypes.string,
    title: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
  }),
};

