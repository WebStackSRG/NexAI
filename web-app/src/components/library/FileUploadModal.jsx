import React, { useState, useRef } from 'react';
import { X, UploadCloud, File, Image, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import styles from './FileUploadModal.module.scss';
import apiClient from '../../lib/apiClient';
import useLibraryStore from '../../store/libraryStore';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit for free tier safety

export default function FileUploadModal({ isOpen, onClose }) {
  const { fetchItems } = useLibraryStore();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successItem, setSuccessItem] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const processFile = (file) => {
    setError(null);
    setSuccessItem(null);

    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed size is 5MB.`);
      return;
    }

    let detectedMime = file.type;
    if (!detectedMime) {
      if (file.name.endsWith('.md')) detectedMime = 'text/markdown';
      else if (file.name.endsWith('.txt')) detectedMime = 'text/plain';
    }

    if (!ALLOWED_MIME_TYPES.includes(detectedMime)) {
      setError('Unsupported file type. Supported types: PDF, TXT, MD, PNG, JPEG, WEBP.');
      return;
    }

    setSelectedFile(file);
    setMimeType(detectedMime);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64Clean = result.split(',')[1];
      setFileBase64(base64Clean);
    };
    reader.onerror = () => {
      setError('Failed to read file from disk.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !fileBase64) {
      setError('Please select a file to upload and analyze.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await apiClient.post('/library/upload', {
        filename: selectedFile.name,
        mimeType: mimeType || selectedFile.type,
        fileBase64,
        prompt: prompt.trim() || undefined,
      });

      setSuccessItem(response.data.item);
      fetchItems();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'File upload and analysis failed.';
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setFileBase64('');
    setMimeType('');
    setPrompt('');
    setError(null);
    setSuccessItem(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const getFileIcon = () => {
    if (!mimeType) return <File size={36} />;
    if (mimeType.startsWith('image/')) return <Image size={36} color="var(--color-accent)" />;
    if (mimeType === 'application/pdf') return <FileText size={36} color="#ef4444" />;
    return <FileText size={36} color="#3b82f6" />;
  };

  return (
    <div className={styles.backdrop} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modal__header}>
          <div>
            <h3 className={styles.modal__title}>Multimodal File Analysis</h3>
            <p className={styles.modal__subtitle}>
              Upload documents or images for AI understanding & Pinecone vector indexing
            </p>
          </div>
          <button type="button" onClick={handleClose} className={styles.modal__closeBtn}>
            <X size={18} />
          </button>
        </div>

        {successItem ? (
          <div className={styles.modal__success}>
            <CheckCircle2 size={44} className={styles.modal__successIcon} />
            <h4>File Analyzed & Indexed Successfully</h4>
            <p className={styles.modal__successTitle}>{successItem.title}</p>
            <div className={styles.modal__successSummary}>{successItem.summary}</div>
            {successItem.tags && (
              <div className={styles.modal__tags}>
                {successItem.tags.map((t) => (
                  <span key={t} className={styles.modal__tag}>#{t}</span>
                ))}
              </div>
            )}
            <button type="button" onClick={handleClose} className={styles.modal__primaryBtn}>
              Done & View Library
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.modal__form}>
            {error && (
              <div className={styles.modal__error}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div
              className={`${styles.dropzone} ${dragOver ? styles['dropzone--active'] : ''} ${
                selectedFile ? styles['dropzone--hasFile'] : ''
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {selectedFile ? (
                <div className={styles.dropzone__preview}>
                  {getFileIcon()}
                  <span className={styles.dropzone__filename}>{selectedFile.name}</span>
                  <span className={styles.dropzone__filesize}>
                    {(selectedFile.size / 1024).toFixed(1)} KB &bull; {mimeType}
                  </span>
                  <button
                    type="button"
                    className={styles.dropzone__changeBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      resetModal();
                    }}
                  >
                    Replace file
                  </button>
                </div>
              ) : (
                <div className={styles.dropzone__prompt}>
                  <UploadCloud size={40} className={styles.dropzone__cloudIcon} />
                  <span className={styles.dropzone__instruction}>
                    <strong>Click to browse</strong> or drag & drop file here
                  </span>
                  <span className={styles.dropzone__hint}>
                    PDF, TXT, MD, PNG, JPG up to 5MB
                  </span>
                </div>
              )}
            </div>

            <div className={styles.modal__field}>
              <label htmlFor="multimodal-prompt" className={styles.modal__label}>
                Analysis Focus or Prompt (Optional)
              </label>
              <input
                id="multimodal-prompt"
                type="text"
                className={styles.modal__input}
                placeholder="E.g. Extract key architectural takeaways or summarize main findings"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isUploading}
              />
            </div>

            <div className={styles.modal__footer}>
              <button
                type="button"
                onClick={handleClose}
                className={styles.modal__cancelBtn}
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.modal__primaryBtn}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Analyzing Multimodal Data...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={16} />
                    <span>Upload & Analyze</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
