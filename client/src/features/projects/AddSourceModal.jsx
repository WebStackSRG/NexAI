import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { UploadCloud, FileText, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { useProjectStore } from '@/store/projectStore';
import styles from './AddSourceModal.module.scss';

const ACCEPTED_EXTENSIONS = '.txt,.md,.markdown,.json,.js,.jsx,.ts,.tsx,.py,.html,.css,.scss,.csv,.yaml,.yml,.xml,.pdf,.sql';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function AddSourceModal({ open, onClose, projectId, onSourceAdded }) {
  const { addSource } = useProjectStore();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const readFileContent = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target.result || '');
      };
      reader.onerror = () => {
        resolve('');
      };
      // For text-based formats and docs
      reader.readAsText(file);
    });
  };

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;

    const newFiles = [];
    for (const file of Array.from(files)) {
      const content = await readFileContent(file);
      newFiles.push({
        file,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'text/plain',
        content,
      });
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !projectId) return;

    setIsUploading(true);
    try {
      for (const item of selectedFiles) {
        await addSource(projectId, {
          name: item.name,
          originalName: item.name,
          mimeType: item.mimeType,
          size: item.size,
          content: item.content,
        });
      }
      setSelectedFiles([]);
      onSourceAdded?.();
      onClose();
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFiles([]);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Local Sources to Context"
    >
      <div
        className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
      >
        <UploadCloud size={36} className={styles.uploadIcon} />
        <div className={styles.dropzoneTitle}>Choose local files or drag & drop</div>
        <div className={styles.dropzoneSubtext}>
          Upload documents, notes, or code to give AI grounded context
        </div>
        <div className={styles.fileFormats}>
          Markdown, PDF, Text, JSON, Code (JS, TS, PY, HTML, CSS, SQL)
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS}
          className={styles.hiddenInput}
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className={styles.selectedList}>
          {selectedFiles.map((item, idx) => (
            <div key={`${item.name}-${idx}`} className={styles.fileItem}>
              <div className={styles.fileInfo}>
                <FileText size={18} className={styles.fileIcon} />
                <div className={styles.fileMeta}>
                  <span className={styles.fileName}>{item.name}</span>
                  <span className={styles.fileSize}>{formatBytes(item.size)}</span>
                </div>
              </div>
              <IconButton
                icon={<X size={14} />}
                label="Remove file"
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile(idx);
                }}
                disabled={isUploading}
              />
            </div>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleUpload}
          loading={isUploading}
          disabled={selectedFiles.length === 0}
        >
          {selectedFiles.length > 1
            ? `Add ${selectedFiles.length} Sources`
            : selectedFiles.length === 1
            ? 'Add Source'
            : 'Add Sources'}
        </Button>
      </div>
    </Modal>
  );
}

AddSourceModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  projectId: PropTypes.string,
  onSourceAdded: PropTypes.func,
};
