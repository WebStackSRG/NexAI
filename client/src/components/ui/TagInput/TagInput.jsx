import { useState } from 'react';
import { Tag } from '../Tag';
import { cn } from '@/lib/utils/cn';
import styles from './TagInput.module.scss';

export function TagInput({
  tags = [],
  onChange,
  placeholder = 'Add tag and press Enter...',
  disabled = false,
  className,
}) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = inputValue.trim().toLowerCase();
      if (trimmed && !tags.includes(trimmed)) {
        onChange?.([...tags, trimmed]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange?.(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove) => {
    if (disabled) return;
    onChange?.(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className={cn(styles.container, disabled && styles.disabled, className)}>
      {tags.map((tag) => (
        <Tag key={tag} label={tag} removable={!disabled} onRemove={() => removeTag(tag)} />
      ))}
      <input
        type="text"
        disabled={disabled}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className={styles.input}
      />
    </div>
  );
}
