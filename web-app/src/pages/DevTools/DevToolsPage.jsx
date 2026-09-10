import React, { useState, useEffect } from 'react';
import {
  Code2,
  Braces,
  Terminal,
  Network,
  Plus,
  Search,
  Copy,
  Check,
  Trash2,
  Edit3,
  Play,
  X,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  Layers,
  Send,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import styles from './DevToolsPage.module.scss';
import useDevToolsStore from '../../store/devToolsStore';

const LANGUAGES = [
  { id: 'all', label: 'All Languages' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'sql', label: 'SQL' },
  { id: 'bash', label: 'Bash / Shell' },
  { id: 'json', label: 'JSON' },
];

export default function DevToolsPage() {
  const {
    activeTab,
    setActiveTab,
    snippets,
    isLoadingSnippets,
    snippetFilterLang,
    setSnippetFilterLang,
    snippetSearch,
    setSnippetSearch,
    fetchSnippets,
    openSnippetModal,
    closeSnippetModal,
    snippetModalOpen,
    editingSnippet,
    saveSnippet,
    deleteSnippet,
  } = useDevToolsStore();

  // Snippet Modal Form state
  const [modalTitle, setModalTitle] = useState('');
  const [modalLang, setModalLang] = useState('javascript');
  const [modalCode, setModalCode] = useState('');
  const [modalTags, setModalTags] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [modalError, setModalError] = useState('');
  const [copiedSnippetId, setCopiedSnippetId] = useState(null);

  // ── JSON Tool state ──────────────────────────────────────────
  const [jsonInput, setJsonInput] = useState('{\\n  "project": "NexAI",\\n  "version": "2.0.0",\\n  "engine": "Gemini 2.0 Flash",\\n  "features": ["Chat", "Library", "Documents", "DevTools"],\\n  "active": true\\n}');
  const [jsonError, setJsonError] = useState(null);
  const [jsonCopied, setJsonCopied] = useState(false);

  // ── Regex Tool state ─────────────────────────────────────────
  const [regexPattern, setRegexPattern] = useState('(?:https?:\\\\/\\\\/)?([a-zA-Z0-9.-]+)\\\\.([a-zA-Z]{2,6})(?:\\\\/[\\\\w.-]*)*');
  const [regexFlags, setRegexFlags] = useState('g');
  const [regexTestText, setRegexTestText] = useState('Check out https://github.com/developer/nexai or contact support at https://nexai.app/docs');
  const [regexMatches, setRegexMatches] = useState([]);
  const [regexError, setRegexError] = useState(null);

  // ── REST API Tool state ──────────────────────────────────────
  const [apiMethod, setApiMethod] = useState('GET');
  const [apiUrl, setApiUrl] = useState('https://jsonplaceholder.typicode.com/todos/1');
  const [apiHeaders, setApiHeaders] = useState('{\\n  "Accept": "application/json"\\n}');
  const [apiBody, setApiBody] = useState('');
  const [apiLoading, setApiLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [apiTiming, setApiTiming] = useState(null);

  useEffect(() => {
    fetchSnippets();
  }, [snippetFilterLang, snippetSearch]);

  // Open modal prefill
  useEffect(() => {
    if (editingSnippet) {
      setModalTitle(editingSnippet.title || '');
      setModalLang(editingSnippet.language || 'javascript');
      setModalCode(editingSnippet.code || '');
      setModalTags((editingSnippet.tags || []).join(', '));
      setModalDesc(editingSnippet.description || '');
    } else {
      setModalTitle('');
      setModalLang('javascript');
      setModalCode('');
      setModalTags('');
      setModalDesc('');
    }
    setModalError('');
  }, [editingSnippet, snippetModalOpen]);

  // Handle Regex Evaluation
  useEffect(() => {
    if (!regexPattern) {
      setRegexMatches([]);
      setRegexError(null);
      return;
    }
    try {
      const reg = new RegExp(regexPattern, regexFlags);
      const matches = [];
      if (regexFlags.includes('g')) {
        const iterator = regexTestText.matchAll(reg);
        for (const match of iterator) {
          matches.push({
            fullMatch: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      } else {
        const m = regexTestText.match(reg);
        if (m) {
          matches.push({
            fullMatch: m[0],
            index: m.index,
            groups: m.slice(1),
          });
        }
      }
      setRegexMatches(matches);
      setRegexError(null);
    } catch (err) {
      setRegexError(err.message);
      setRegexMatches([]);
    }
  }, [regexPattern, regexFlags, regexTestText]);

  // Copy Snippet Action
  const handleCopySnippet = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  // Submit Snippet
  const handleSubmitSnippet = async (e) => {
    e.preventDefault();
    if (!modalTitle.trim()) {
      setModalError('Please enter a snippet title');
      return;
    }
    if (!modalCode.trim()) {
      setModalError('Please provide snippet code');
      return;
    }

    try {
      const tagList = modalTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      await saveSnippet({
        title: modalTitle.trim(),
        language: modalLang,
        code: modalCode,
        tags: tagList,
        description: modalDesc.trim(),
      });
      closeSnippetModal();
    } catch (err) {
      setModalError(err.message || 'Failed to save snippet');
    }
  };

  // JSON Helpers
  const formatJson = (spaces = 2) => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, spaces));
      setJsonError(null);
    } catch (err) {
      setJsonError(err.message);
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed));
      setJsonError(null);
    } catch (err) {
      setJsonError(err.message);
    }
  };

  const copyJson = () => {
    navigator.clipboard.writeText(jsonInput);
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2000);
  };

  // REST API Tester
  const executeApiRequest = async (e) => {
    e.preventDefault();
    if (!apiUrl.trim()) return;

    setApiLoading(true);
    setApiResponse(null);
    const startTime = performance.now();

    try {
      let parsedHeaders = {};
      if (apiHeaders.trim()) {
        try {
          parsedHeaders = JSON.parse(apiHeaders);
        } catch {
          // fallback plain header parse
        }
      }

      const options = {
        method: apiMethod,
        headers: parsedHeaders,
      };

      if (['POST', 'PUT', 'PATCH'].includes(apiMethod) && apiBody.trim()) {
        options.body = apiBody;
      }

      const res = await fetch(apiUrl.trim(), options);
      const endTime = performance.now();
      setApiTiming(Math.round(endTime - startTime));

      const contentType = res.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      const resHeaders = {};
      res.headers.forEach((val, key) => {
        resHeaders[key] = val;
      });

      setApiResponse({
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        headers: resHeaders,
        data,
      });
    } catch (err) {
      const endTime = performance.now();
      setApiTiming(Math.round(endTime - startTime));
      setApiResponse({
        error: err.message,
        status: 0,
        statusText: 'Network / CORS Error',
      });
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* ── Header ───────────────────────────────────────────── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Developer Utilities</h1>
          <p className={styles.subtitle}>
            Integrated engineering toolset designed for rapid debugging, snippet curation, and API synthesis.
          </p>
        </div>
      </header>

      {/* ── Utilities Tab Switcher ────────────────────────────── */}
      <div className={styles.tabNav}>
        <button
          type="button"
          onClick={() => setActiveTab('snippets')}
          className={`${styles.tabBtn} ${activeTab === 'snippets' ? styles['tabBtn--active'] : ''}`}
        >
          <Code2 size={16} />
          <span>Code Snippets Vault</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('json')}
          className={`${styles.tabBtn} ${activeTab === 'json' ? styles['tabBtn--active'] : ''}`}
        >
          <Braces size={16} />
          <span>JSON Formatter & Validator</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('regex')}
          className={`${styles.tabBtn} ${activeTab === 'regex' ? styles['tabBtn--active'] : ''}`}
        >
          <Terminal size={16} />
          <span>Regex Sandbox</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('api')}
          className={`${styles.tabBtn} ${activeTab === 'api' ? styles['tabBtn--active'] : ''}`}
        >
          <Network size={16} />
          <span>REST API Tester</span>
        </button>
      </div>

      {/* ── 1. Code Snippets Vault Tab ─────────────────────────── */}
      {activeTab === 'snippets' && (
        <div className={styles.snippetsWorkspace}>
          <div className={styles.snippetsToolbar}>
            <div className={styles.searchBox}>
              <Search size={14} color="var(--text-tertiary)" />
              <input
                type="text"
                placeholder="Search snippets by title, tags, or code..."
                value={snippetSearch}
                onChange={(e) => setSnippetSearch(e.target.value)}
              />
            </div>

            <div className={styles.filterRow}>
              <select
                value={snippetFilterLang}
                onChange={(e) => setSnippetFilterLang(e.target.value)}
                className={styles.langSelect}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => openSnippetModal()}
                className={styles.primaryBtn}
              >
                <Plus size={16} />
                <span>New Snippet</span>
              </button>
            </div>
          </div>

          {isLoadingSnippets ? (
            <div className={styles.loadingState}>
              <Loader2 size={24} className="spin" />
              <span>Loading snippet vault...</span>
            </div>
          ) : snippets.length === 0 ? (
            <div className={styles.emptyState}>
              <Code2 size={40} color="var(--text-tertiary)" />
              <h3>{snippetSearch ? 'No snippets match your criteria' : 'Your Snippets Vault is empty'}</h3>
              <p>Store code fragments, algorithms, configuration files, and zero-knowledge helpers for instant recall.</p>
              {!snippetSearch && (
                <button
                  type="button"
                  onClick={() => openSnippetModal()}
                  className={styles.primaryBtn}
                >
                  <Plus size={16} />
                  <span>Create First Snippet</span>
                </button>
              )}
            </div>
          ) : (
            <div className={styles.snippetsGrid}>
              {snippets.map((s) => {
                const sid = s._id || s.id;
                const isCopied = copiedSnippetId === sid;

                return (
                  <div key={sid} className={styles.snippetCard}>
                    <div className={styles.snippetHeader}>
                      <div>
                        <h3 className={styles.snippetTitle}>{s.title}</h3>
                        <span className={styles.langBadge}>{s.language}</span>
                      </div>
                      <div className={styles.snippetActions}>
                        <button
                          type="button"
                          onClick={() => handleCopySnippet(sid, s.code)}
                          className={styles.actionBtn}
                          title="Copy Code"
                        >
                          {isCopied ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => openSnippetModal(s)}
                          className={styles.actionBtn}
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Delete this snippet?')) deleteSnippet(sid);
                          }}
                          className={`${styles.actionBtn} ${styles['actionBtn--danger']}`}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {s.description && <p className={styles.snippetDesc}>{s.description}</p>}

                    <pre className={styles.snippetCodeBlock}>
                      <code>{s.code}</code>
                    </pre>

                    {s.tags && s.tags.length > 0 && (
                      <div className={styles.tagsWrap}>
                        {s.tags.map((t) => (
                          <span key={t} className={styles.tag}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 2. JSON Formatter & Validator Tab ──────────────────── */}
      {activeTab === 'json' && (
        <div className={styles.utilityWorkspace}>
          <div className={styles.utilityControls}>
            <button type="button" onClick={() => formatJson(2)} className={styles.secBtn}>
              <Sparkles size={14} />
              <span>Prettify (2 Spaces)</span>
            </button>
            <button type="button" onClick={() => formatJson(4)} className={styles.secBtn}>
              <span>Prettify (4 Spaces)</span>
            </button>
            <button type="button" onClick={minifyJson} className={styles.secBtn}>
              <span>Minify</span>
            </button>
            <button type="button" onClick={copyJson} className={styles.secBtn}>
              {jsonCopied ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
              <span>{jsonCopied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setJsonInput('');
                setJsonError(null);
              }}
              className={styles.secBtn}
            >
              <RotateCcw size={14} />
              <span>Clear</span>
            </button>
          </div>

          {jsonError && (
            <div className={styles.alertError}>
              <AlertTriangle size={16} />
              <span>Invalid JSON: {jsonError}</span>
            </div>
          )}

          <div className={styles.editorPane}>
            <textarea
              className={styles.codeTextarea}
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setJsonError(null);
              }}
              placeholder="Paste or type JSON here..."
              spellCheck="false"
            />
          </div>
        </div>
      )}

      {/* ── 3. Regex Sandbox Tab ───────────────────────────────── */}
      {activeTab === 'regex' && (
        <div className={styles.utilityWorkspace}>
          <div className={styles.regexInputsRow}>
            <div className={styles.regexField}>
              <label>Pattern</label>
              <div className={styles.regexWrap}>
                <span className={styles.regexSlash}>/</span>
                <input
                  type="text"
                  value={regexPattern}
                  onChange={(e) => setRegexPattern(e.target.value)}
                  placeholder="e.g. [a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}"
                  className={styles.regexInput}
                />
                <span className={styles.regexSlash}>/</span>
                <input
                  type="text"
                  value={regexFlags}
                  onChange={(e) => setRegexFlags(e.target.value)}
                  placeholder="gims"
                  className={styles.regexFlagsInput}
                />
              </div>
            </div>
          </div>

          {regexError && (
            <div className={styles.alertError}>
              <AlertTriangle size={16} />
              <span>Regex Error: {regexError}</span>
            </div>
          )}

          <div className={styles.regexSplitView}>
            <div className={styles.regexPane}>
              <label>Test String</label>
              <textarea
                className={styles.codeTextarea}
                value={regexTestText}
                onChange={(e) => setRegexTestText(e.target.value)}
                placeholder="Enter string to test pattern against..."
                spellCheck="false"
              />
            </div>

            <div className={styles.regexPane}>
              <label>Matches ({regexMatches.length})</label>
              <div className={styles.matchesList}>
                {regexMatches.length === 0 ? (
                  <div className={styles.emptyMatches}>No matches found for current pattern.</div>
                ) : (
                  regexMatches.map((m, idx) => (
                    <div key={idx} className={styles.matchItem}>
                      <div className={styles.matchHeader}>
                        <span className={styles.matchIndex}>Match #{idx + 1}</span>
                        <span className={styles.matchPos}>Index: {m.index}</span>
                      </div>
                      <code className={styles.matchVal}>{m.fullMatch}</code>
                      {m.groups.length > 0 && (
                        <div className={styles.captureGroups}>
                          {m.groups.map((g, gIdx) => (
                            <span key={gIdx} className={styles.groupBadge}>
                              Group {gIdx + 1}: {g !== undefined ? g : 'undefined'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. REST API Tester Tab ─────────────────────────────── */}
      {activeTab === 'api' && (
        <div className={styles.utilityWorkspace}>
          <form onSubmit={executeApiRequest} className={styles.apiBar}>
            <select
              value={apiMethod}
              onChange={(e) => setApiMethod(e.target.value)}
              className={styles.methodSelect}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>

            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.example.com/endpoint"
              required
              className={styles.urlInput}
            />

            <button type="submit" disabled={apiLoading} className={styles.primaryBtn}>
              {apiLoading ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
              <span>Send</span>
            </button>
          </form>

          <div className={styles.apiConfigGrid}>
            <div className={styles.apiConfigPane}>
              <label>Headers (JSON)</label>
              <textarea
                className={styles.apiTextarea}
                value={apiHeaders}
                onChange={(e) => setApiHeaders(e.target.value)}
                placeholder='{ "Authorization": "Bearer token" }'
                spellCheck="false"
              />
            </div>

            {['POST', 'PUT', 'PATCH'].includes(apiMethod) && (
              <div className={styles.apiConfigPane}>
                <label>Request Body (JSON / Raw)</label>
                <textarea
                  className={styles.apiTextarea}
                  value={apiBody}
                  onChange={(e) => setApiBody(e.target.value)}
                  placeholder='{ "key": "value" }'
                  spellCheck="false"
                />
              </div>
            )}
          </div>

          {apiResponse && (
            <div className={styles.apiResponsePane}>
              <div className={styles.apiResponseHeader}>
                <span
                  className={`${styles.statusBadge} ${
                    apiResponse.ok ? styles['statusBadge--success'] : styles['statusBadge--error']
                  }`}
                >
                  Status: {apiResponse.status} {apiResponse.statusText}
                </span>
                {apiTiming !== null && <span className={styles.timingBadge}>Time: {apiTiming} ms</span>}
              </div>

              <div className={styles.responseBody}>
                <pre>
                  <code>
                    {typeof apiResponse.data === 'object'
                      ? JSON.stringify(apiResponse.data, null, 2)
                      : apiResponse.data || apiResponse.error}
                  </code>
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Snippet Modal (Create / Edit) ─────────────────────── */}
      {snippetModalOpen && (
        <div className={styles.modalBackdrop} onClick={closeSnippetModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingSnippet ? 'Edit Snippet' : 'New Code Snippet'}</h3>
              <button type="button" onClick={closeSnippetModal} className={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitSnippet} className={styles.modalForm}>
              {modalError && <div className={styles.alertError}>{modalError}</div>}

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Title</label>
                  <input
                    type="text"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    placeholder="e.g. Web Crypto AES-GCM Encrypt"
                    required
                    autoFocus
                    className={styles.modalInput}
                  />
                </div>

                <div className={styles.field}>
                  <label>Language</label>
                  <select
                    value={modalLang}
                    onChange={(e) => setModalLang(e.target.value)}
                    className={styles.modalSelect}
                  >
                    {LANGUAGES.filter((l) => l.id !== 'all').map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label>Description (Optional)</label>
                <input
                  type="text"
                  value={modalDesc}
                  onChange={(e) => setModalDesc(e.target.value)}
                  placeholder="Brief summary of implementation intent"
                  className={styles.modalInput}
                />
              </div>

              <div className={styles.field}>
                <label>Code Snippet</label>
                <textarea
                  value={modalCode}
                  onChange={(e) => setModalCode(e.target.value)}
                  placeholder="Paste your source code here..."
                  required
                  rows={8}
                  className={styles.modalTextarea}
                  spellCheck="false"
                />
              </div>

              <div className={styles.field}>
                <label>Tags (Comma separated)</label>
                <input
                  type="text"
                  value={modalTags}
                  onChange={(e) => setModalTags(e.target.value)}
                  placeholder="crypto, security, web-crypto"
                  className={styles.modalInput}
                />
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={closeSnippetModal} className={styles.secBtn}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn}>
                  <span>{editingSnippet ? 'Save Changes' : 'Create Snippet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}