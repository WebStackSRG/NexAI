import { useState, useRef } from 'react';
import { UploadCloud, FileText, Sparkles, Check, Paperclip, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { TagInput } from '@/components/ui/TagInput';
import { useLibraryStore } from '@/store/libraryStore';
import { cn } from '@/lib/utils/cn';
import styles from './FileUploaderModal.module.scss';

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function FileUploaderModal() {
  const {
    isUploadModalOpen,
    closeUploadModal,
    saveItem,
    isSaving,
    suggestItem,
    isSuggesting,
  } = useLibraryStore();

  const fileInputRef = useRef(null);

  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState(['file', 'upload']);

  const handleFileProcess = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setTitle(file.name.replace(/\.[^/.]+$/, ''));

    // Extract text content if text-based
    if (file.type.startsWith('text/') || file.name.match(/\.(md|txt|json|csv|js|ts|jsx|tsx|py|html|css|yaml|yml)$/i)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result || '';
        setFileContent(text);
      };
      reader.readAsText(file);
    } else {
      // For binary / PDF files, store reference with description
      setFileContent(`[Attached File: ${file.name} (${formatFileSize(file.size)})]`);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleAutoSuggest = async () => {
    if (!fileContent && !selectedFile) return;
    try {
      const suggestion = await suggestItem({
        type: 'file',
        content: fileContent.slice(0, 3000) || selectedFile?.name || '',
        fileName: selectedFile?.name || '',
      });
      if (suggestion) {
        if (suggestion.title) setTitle(suggestion.title);
        if (suggestion.summary) setSummary(suggestion.summary);
        if (suggestion.tags) setTags(suggestion.tags);
      }
    } catch {
      // Error handled in store
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!selectedFile || !title.trim()) return;

    await saveItem({
      type: 'file',
      title: title.trim(),
      fileName: selectedFile.name,
      mimeType: selectedFile.type || 'text/plain',
      size: selectedFile.size || 0,
      content: fileContent,
      summary: summary.trim(),
      tags,
    });

    handleClose();
  };

  const handleClose = () => {
    setSelectedFile(null);
    setFileContent('');
    setTitle('');
    setSummary('');
    setTags(['file', 'upload']);
    closeUploadModal();
  };

  if (!isUploadModalOpen) return null;

  return (
    <Modal
      open={isUploadModalOpen}
      onClose={handleClose}
      title={
        <div className={styles.modalTitle}>
          <Paperclip size={18} className={styles.titleIcon} />
          <span>Upload File to Library</span>
        </div>
      }
      className={styles.modalContainer}
    >
      <form onSubmit={handleSave} className={styles.form}>
        {!selectedFile ? (
          /* Dropzone */
          <div
            className={cn(styles.dropzone, dragOver && styles.dropzoneActive)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleInputChange}
              style={{ display: 'none' }}
              accept=".txt,.md,.markdown,.json,.csv,.pdf,.js,.ts,.py"
            />
            <div className={styles.dropzoneIcon}>
              <UploadCloud size={32} />
            </div>
            <p className={styles.dropzoneText}>
              <strong>Click to upload</strong> or drag and drop files here
            </p>
            <p className={styles.dropzoneHint}>
              Supports Markdown (.md), Text (.txt), JSON, CSV, and PDF documents
            </p>
          </div>
        ) : (
          /* Selected File Preview & Details Form */
          <div className={styles.fileDetails}>
            <div className={styles.fileCard}>
              <div className={styles.fileIconWrapper}>
                <FileText size={20} />
              </div>
              <div className={styles.fileMeta}>
                <span className={styles.fileName}>{selectedFile.name}</span>
                <span className={styles.fileSize}>{formatFileSize(selectedFile.size)}</span>
              </div>
              <button
                type="button"
                className={styles.removeFileBtn}
                onClick={() => setSelectedFile(null)}
                aria-label="Remove selected file"
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.aiAssistBar}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAutoSuggest}
                disabled={isSuggesting}
                loading={isSuggesting}
                leftIcon={<Sparkles size={14} />}
              >
                {isSuggesting ? 'Analyzing File...' : 'Auto-Generate Summary & Tags'}
              </Button>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Library Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give this item a descriptive title"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Summary</label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary of file contents..."
                rows={2}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Tags</label>
              <TagInput tags={tags} onChange={setTags} placeholder="Add tags..." />
            </div>

            {fileContent && (
              <div className={styles.inputGroup}>
                <label className={styles.label}>Extracted Text Preview</label>
                <div className={styles.contentPreview}>
                  <pre>{fileContent.slice(0, 1000)}</pre>
                  {fileContent.length > 1000 && <span className={styles.ellipsisHint}>...</span>}
                </div>
              </div>
            )}
          </div>
        )}

        <div className={styles.footerActions}>
          <Button variant="ghost" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!selectedFile || !title.trim() || isSaving}
            loading={isSaving}
            leftIcon={<Check size={16} />}
          >
            Save to Library
          </Button>
        </div>
      </form>
    </Modal>
  );
}
