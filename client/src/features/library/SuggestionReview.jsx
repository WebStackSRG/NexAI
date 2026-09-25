import { useState } from 'react';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { TagInput } from '@/components/ui/TagInput';
import { Button } from '@/components/ui/Button';
import styles from './SuggestionReview.module.scss';

export function SuggestionReview({ suggestion, onSave, onBack, isSaving }) {
  const [title, setTitle] = useState(suggestion.title || '');
  const [summary, setSummary] = useState(suggestion.summary || '');
  const [tags, setTags] = useState(suggestion.tags || []);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!title.trim()) {
      setError('Title cannot be empty');
      return;
    }
    setError('');
    onSave({
      type: suggestion.type,
      url: suggestion.url || undefined,
      title: title.trim(),
      summary: summary.trim(),
      tags,
      content: suggestion.content,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.banner}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} className={styles.bannerBadge} />
          <span>AI Suggestions generated with Gemini Flash</span>
        </div>
        {suggestion.creditsDeducted > 0 && (
          <span className={styles.bannerBadge}>
            {suggestion.creditsDeducted} credit{suggestion.creditsDeducted > 1 ? 's' : ''} used
          </span>
        )}
      </div>

      {suggestion.url && (
        <div className={styles.field}>
          <span className={styles.label}>Source URL</span>
          <div className={styles.sourcePreview} title={suggestion.url}>
            {suggestion.url}
          </div>
        </div>
      )}

      <div className={styles.field}>
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={error}
          placeholder="Descriptive title"
          autoFocus
        />
      </div>

      <div className={styles.field}>
        <Textarea
          label="Summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Brief 2-3 sentence summary"
          rows={3}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Tags</span>
        <TagInput tags={tags} onChange={setTags} placeholder="Add tags (press Enter)..." />
        <span className={styles.tagHelp}>
          Tags help organize and filter items across your knowledge base.
        </span>
      </div>

      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          leftIcon={<ArrowLeft size={16} />}
          disabled={isSaving}
        >
          Back
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleSave}
          loading={isSaving}
          leftIcon={<Check size={16} />}
        >
          Confirm & Save
        </Button>
      </div>
    </div>
  );
}
