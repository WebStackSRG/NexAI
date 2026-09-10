import React from 'react';
import { FileText, Wand2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Wand2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Download,
  BookOpen,
  Save,
  CheckCircle,
  Clock,
  Sparkles,
  Layers,
  FileCode,
} from 'lucide-react';
import useDocumentStore from '../../store/documentStore';
import { exportToPdf, exportToDocx } from '../../lib/documentExport';
import { indexDocumentToLibrary } from '../../lib/documentApi';
import TiptapSectionEditor from './TiptapSectionEditor';
import styles from './DocumentsPage.module.scss';
import useDocumentStore from '../../store/documentStore';

export default function DocumentsPage() {
  const { documents } = useDocumentStore();
  const {
    documents,
    activeDocument,
    sections,
    isGenerating,
    isSaving,
    isLoading,
    hasUnsavedChanges,
    loadDocuments,
    setActiveDocument,
    generateAndCreate,
    saveActiveDocument,
    addSection,
    removeSection,
    moveSection,
    updateSection,
    deleteActiveDocument,
  } = useDocumentStore();

  // Generator form states
  const [topicPrompt, setTopicPrompt] = useState('');
  const [selectedTone, setSelectedTone] = useState('technical');
  const [sectionCount, setSectionCount] = useState(4);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  // Status notification banners
  const [toastMessage, setToastMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);

  useEffect(() => {
    loadDocuments().then((docs) => {
      if (docs && docs.length > 0 && !activeDocument) {
        setActiveDocument(docs[0]);
      }
    });
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topicPrompt.trim() || isGenerating) return;

    try {
      showToast('Generating document structure with Gemini 2.5 Pro...');
      const created = await generateAndCreate({
        topic: topicPrompt.trim(),
        tone: selectedTone,
        sectionCount: Number(sectionCount),
      });
      setTopicPrompt('');
      setActiveSectionIndex(0);
      showToast('Document generated successfully!');
    } catch (err) {
      showToast(err.message || 'Generation failed');
    }
  };

  const handleManualSave = async () => {
    try {
      await saveActiveDocument();
      showToast('Document saved successfully!');
    } catch (err) {
      showToast('Failed to save document');
    }
  };

  const handleExportPdf = async () => {
    if (!activeDocument) return;
    try {
      setIsExporting(true);
      showToast('Compiling pure JS PDF via pdf-lib...');
      await exportToPdf({
        title: activeDocument.title,
        sections,
      });
      showToast('PDF downloaded successfully!');
    } catch (err) {
      showToast('PDF export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDocx = async () => {
    if (!activeDocument) return;
    try {
      setIsExporting(true);
      showToast('Compiling pure JS Word document via docx...');
      await exportToDocx({
        title: activeDocument.title,
        sections,
      });
      showToast('DOCX downloaded successfully!');
    } catch (err) {
      showToast('DOCX export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleIndexLibrary = async () => {
    if (!activeDocument) return;
    try {
      setIsIndexing(true);
      showToast('Indexing into Knowledge Library for RAG...');
      await indexDocumentToLibrary(activeDocument._id || activeDocument.id);
      showToast('Indexed into Pinecone & Knowledge Library!');
    } catch (err) {
      showToast('Failed to index into library');
    } finally {
      setIsIndexing(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Word & Character count calculation
  const totalWords = sections.reduce((acc, s) => {
    const text = (s.body || '').replace(/<[^>]*>?/gm, '');
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return acc + words;
  }, 0);

  return (
    <div className={styles.documents}>
      {/* Top Banner / Toast */}
      {toastMessage && (
        <div className={styles.documents__toast}>
          <Sparkles size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Title & Action Controls */}
      <div className={styles.documents__header}>
        <div>
          <h2 className={styles.documents__title}>AI Document Studio</h2>
          <p className={styles.documents__description}>
            Generate structured multi-section reports with Gemini 2.5 Pro, Tiptap editing, and pure JS PDF/DOCX exports.
            Generate structured multi-section technical reports with Gemini 2.5 Pro, Tiptap WYSIWYG editing, and zero-RAM pure JS PDF/DOCX downloads.
          </p>
        </div>
        <button className={styles.documents__actionButton}>
          <Wand2 size={16} />
          <span>New AI Document</span>
        </button>

        <div className={styles.documents__headerActions}>
          {activeDocument && (
            <>
              <button
                type="button"
                className={styles.documents__btnOutline}
                onClick={handleExportPdf}
                disabled={isExporting}
                title="Download formatted PDF via pure JS pdf-lib"
              >
                <Download size={15} />
                <span>PDF</span>
              </button>

              <button
                type="button"
                className={styles.documents__btnOutline}
                onClick={handleExportDocx}
                disabled={isExporting}
                title="Download formatted DOCX via pure JS docx package"
              >
                <FileCode size={15} />
                <span>DOCX</span>
              </button>

              <button
                type="button"
                className={styles.documents__btnOutline}
                onClick={handleIndexLibrary}
                disabled={isIndexing}
                title="Ground this document in RAG vector search"
              >
                <BookOpen size={15} />
                <span>Index for RAG</span>
              </button>

              <button
                type="button"
                className={`${styles.documents__btnPrimary} ${
                  hasUnsavedChanges ? styles['documents__btnPrimary--pulse'] : ''
                }`}
                onClick={handleManualSave}
                disabled={isSaving}
              >
                <Save size={15} />
                <span>{isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className={styles.documents__card}>
        <FileText size={48} color="var(--color-accent)" />
        <h3 className={styles.documents__cardTitle}>Start a structured document</h3>
        <p className={styles.documents__cardText}>
          Describe what you want to write. NexAI will generate sections, research citations, and format clean PDF/DOCX downloads without heavy headless browsers.
        </p>
      {/* Generation Bar / AI Prompt Bar */}
      <div className={styles.documents__generatorBar}>
        <form onSubmit={handleGenerate} className={styles.documents__genForm}>
          <div className={styles.documents__genInputWrap}>
            <Wand2 size={18} className={styles.documents__genIcon} />
            <input
              type="text"
              value={topicPrompt}
              onChange={(e) => setTopicPrompt(e.target.value)}
              placeholder="e.g. Distributed Consensus in Cloud-Native Microservices or Zero-Trust Auth Architecture"
              className={styles.documents__genInput}
              disabled={isGenerating}
            />
          </div>

          <div className={styles.documents__genControls}>
            <select
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value)}
              className={styles.documents__select}
              disabled={isGenerating}
            >
              <option value="technical">Technical / Architect</option>
              <option value="academic">Academic / Viva</option>
              <option value="professional">Executive Summary</option>
              <option value="creative">Narrative Overview</option>
            </select>

            <select
              value={sectionCount}
              onChange={(e) => setSectionCount(e.target.value)}
              className={styles.documents__select}
              disabled={isGenerating}
            >
              <option value={3}>3 Sections</option>
              <option value={4}>4 Sections</option>
              <option value={5}>5 Sections</option>
              <option value={6}>6 Sections</option>
            </select>

            <button
              type="submit"
              className={styles.documents__genSubmit}
              disabled={!topicPrompt.trim() || isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className={styles.documents__spinner} />
                  <span>Gemini 2.5 Pro...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Generate Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Main Studio Two-Panel Workspace */}
      <div className={styles.documents__workspace}>
        {/* Left Panel: Document List & Outline Manager */}
        <div className={styles.documents__leftPanel}>
          {/* Documents History Tab */}
          <div className={styles.documents__panelHeader}>
            <div className={styles.documents__panelTitle}>
              <Layers size={16} />
              <span>Document Outline</span>
            </div>
            <button
              type="button"
              className={styles.documents__addSectionBtn}
              onClick={() => addSection('New Section', '<p>Enter content...</p>')}
              title="Add a new section"
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </div>

          {/* Section Outline Cards */}
          <div className={styles.documents__sectionList}>
            {sections.length === 0 ? (
              <div className={styles.documents__emptySections}>
                <FileText size={32} opacity={0.4} />
                <p>No sections yet. Use the prompt generator above or click "Add" to start writing.</p>
              </div>
            ) : (
              sections.map((section, idx) => (
                <div
                  key={idx}
                  className={`${styles.documents__sectionCard} ${
                    activeSectionIndex === idx ? styles['documents__sectionCard--active'] : ''
                  }`}
                  onClick={() => setActiveSectionIndex(idx)}
                >
                  <div className={styles.documents__sectionCardHead}>
                    <span className={styles.documents__sectionNumber}>{idx + 1}</span>
                    <span className={styles.documents__sectionHeading}>
                      {section.heading || 'Untitled Section'}
                    </span>
                  </div>

                  <div
                    className={styles.documents__sectionActions}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, idx - 1)}
                      className={styles.documents__actionIconBtn}
                      title="Move up"
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sections.length - 1}
                      onClick={() => moveSection(idx, idx + 1)}
                      className={styles.documents__actionIconBtn}
                      title="Move down"
                    >
                      <ChevronDown size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSection(idx)}
                      className={`${styles.documents__actionIconBtn} ${styles['documents__actionIconBtn--danger']}`}
                      title="Remove section"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Recent Documents Library */}
          <div className={styles.documents__historySection}>
            <span className={styles.documents__historyTitle}>Saved Documents</span>
            <div className={styles.documents__historyList}>
              {documents.map((doc) => (
                <div
                  key={doc._id || doc.id}
                  className={`${styles.documents__historyItem} ${
                    (activeDocument?._id || activeDocument?.id) === (doc._id || doc.id)
                      ? styles['documents__historyItem--active']
                      : ''
                  }`}
                  onClick={() => setActiveDocument(doc)}
                >
                  <FileText size={14} className={styles.documents__historyIcon} />
                  <span className={styles.documents__historyItemTitle}>{doc.title}</span>
                  <button
                    type="button"
                    className={styles.documents__historyDelete}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteActiveDocument(doc._id || doc.id);
                    }}
                    title="Delete document"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Active Section Tiptap Rich-Text Editor */}
        <div className={styles.documents__rightPanel}>
          {sections.length > 0 && sections[activeSectionIndex] ? (
            <div className={styles.documents__editorWrapper}>
              {/* Document & Section Title Row */}
              <div className={styles.documents__editorHeader}>
                <div className={styles.documents__docMeta}>
                  <input
                    type="text"
                    value={activeDocument?.title || 'Untitled Document'}
                    onChange={(e) => {
                      if (activeDocument) {
                        activeDocument.title = e.target.value;
                        useDocumentStore.setState({ activeDocument: { ...activeDocument } });
                      }
                    }}
                    className={styles.documents__docTitleInput}
                    placeholder="Document Title"
                  />
                  <div className={styles.documents__telemetry}>
                    <span>{sections.length} sections</span>
                    <span>•</span>
                    <span>~{totalWords} words</span>
                    <span>•</span>
                    <span className={styles.documents__readyBadge}>
                      <CheckCircle size={12} /> Pure JS Export Ready
                    </span>
                  </div>
                </div>

                <div className={styles.documents__sectionTitleField}>
                  <label className={styles.documents__fieldLabel}>Section Heading</label>
                  <input
                    type="text"
                    value={sections[activeSectionIndex].heading || ''}
                    onChange={(e) =>
                      updateSection(activeSectionIndex, 'heading', e.target.value)
                    }
                    placeholder="Enter section heading..."
                    className={styles.documents__sectionHeadingInput}
                  />
                </div>
              </div>

              {/* Tiptap Rich Text Editor */}
              <div className={styles.documents__tiptapContainer}>
                <TiptapSectionEditor
                  content={sections[activeSectionIndex].body || ''}
                  onChange={(html) =>
                    updateSection(activeSectionIndex, 'body', html)
                  }
                  placeholder={`Write details for "${sections[activeSectionIndex].heading || 'this section'}"...`}
                />
              </div>
            </div>
          ) : (
            <div className={styles.documents__emptyRight}>
              <FileText size={48} color="var(--color-accent)" opacity={0.6} />
              <h3>No Active Document Selected</h3>
              <p>Type a topic above to generate a full document with Gemini 2.5 Pro, or select a document from the left outline.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
