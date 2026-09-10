import React, { useEffect, useState } from 'react';
import {
  Layers,
  Youtube,
  Clock,
  Sparkles,
  RotateCw,
  Plus,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  ExternalLink,
  ChevronRight,
  Bell,
  Briefcase,
  Calendar,
} from 'lucide-react';
import useLearningStore from '../../store/learningStore';
import useFocusStore from '../../store/focusStore';
import styles from './FocusPage.module.scss';

export default function FocusPage() {
  const {
    activeTab,
    setActiveTab,
    flashcards,
    dueFlashcards,
    selectedTopic,
    setSelectedTopic,
    isLoading,
    isGenerating,
    error,
    currentCardIndex,
    isFlipped,
    reviewCompleted,
    flipCard,
    fetchFlashcards,
    reviewCard,
    generateDeck,
    createFlashcard,
    deleteFlashcard,
    youtubeUrl,
    setYoutubeUrl,
    isSummarizing,
    youtubeSummary,
    summarizeYouTube,
    focusTimeLeft,
    timerRunning,
    timerMode,
    setTimerMode,
    setTimerRunning,
    tickTimer,
    resetTimer,
  } = useLearningStore();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newTopic, setNewTopic] = useState('General');
  const [genTopic, setGenTopic] = useState('');
  const [genCount, setGenCount] = useState(5);

  const {
    reminders,
    sessions,
    quietHours,
    fetchReminders,
    createReminder,
    toggleReminderComplete,
    deleteReminder,
    fetchSessions,
    createSession,
    deleteSession,
    updateQuietHours,
  } = useFocusStore();

  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [quietHoursModalOpen, setQuietHoursModalOpen] = useState(false);

  const [remTitle, setRemTitle] = useState('');
  const [remDate, setRemDate] = useState('');
  const [remItemType, setRemItemType] = useState('custom');

  const [sessName, setSessName] = useState('');
  const [sessDesc, setSessDesc] = useState('');
  const [sessLinks, setSessLinks] = useState([{ title: '', url: '' }]);

  const [qhEnabled, setQhEnabled] = useState(quietHours.enabled);
  const [qhStart, setQhStart] = useState(quietHours.start || '22:00');
  const [qhEnd, setQhEnd] = useState(quietHours.end || '08:00');

  useEffect(() => {
    fetchFlashcards();
    fetchReminders();
    fetchSessions();
  }, [selectedTopic]);

  // Pomodoro timer tick interval
  useEffect(() => {
    let interval = null;
    if (timerRunning) {
      interval = setInterval(() => {
        tickTimer();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const activeCard = dueFlashcards[currentCardIndex];
  const topics = Array.from(new Set(['all', ...flashcards.map((c) => c.topic || 'General')]));

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    const ok = await createFlashcard({
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      topic: newTopic.trim() || 'General',
    });
    if (ok) {
      setNewQuestion('');
      setNewAnswer('');
      setCreateModalOpen(false);
    }
  };

  const handleGenerateDeck = async (e) => {
    e.preventDefault();
    if (!genTopic.trim()) return;
    const ok = await generateDeck({
      topic: genTopic.trim(),
      count: genCount,
    });
    if (ok) {
      setGenTopic('');
      setGenerateModalOpen(false);
    }
  };

  const handleYouTubeSubmit = (e) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;
    summarizeYouTube(youtubeUrl.trim());
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>Learning & Focus Suite</h1>
            <p className={styles.subtitle}>
              Spaced repetition flashcards (SM-2), AI lecture summaries, and pomodoro focus timers.
            </p>
          </div>
          <div className={styles.tabNav}>
            <button
              className={activeTab === 'flashcards' ? `${styles.tabBtn} ${styles.tabActive}` : styles.tabBtn}
              onClick={() => setActiveTab('flashcards')}
            >
              <Layers size={16} /> Flashcards (SM-2)
            </button>
            <button
              className={activeTab === 'youtube' ? `${styles.tabBtn} ${styles.tabActive}` : styles.tabBtn}
              onClick={() => setActiveTab('youtube')}
            >
              <Youtube size={16} /> Lecture Summarizer
            </button>
            <button
              className={activeTab === 'pomodoro' ? `${styles.tabBtn} ${styles.tabActive}` : styles.tabBtn}
              onClick={() => setActiveTab('pomodoro')}
            >
              <Clock size={16} /> Focus Timer
            </button>
            <button
              className={activeTab === 'reminders' ? `${styles.tabBtn} ${styles.tabActive}` : styles.tabBtn}
              onClick={() => setActiveTab('reminders')}
            >
              <Bell size={16} /> Reminders & Sessions
            </button>
          </div>
        </div>
      </header>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* TAB 1: FLASHCARDS & SM-2 */}
      {activeTab === 'flashcards' && (
        <div className={styles.flashcardsSection}>
          <div className={styles.toolbar}>
            <div className={styles.topicFilters}>
              {topics.map((t) => (
                <button
                  key={t}
                  className={selectedTopic === t ? `${styles.topicPill} ${styles.topicActive}` : styles.topicPill}
                  onClick={() => setSelectedTopic(t)}
                >
                  {t === 'all' ? 'All Topics' : t}
                </button>
              ))}
            </div>
            <div className={styles.toolActions}>
              <button
                className={styles.actionBtnSecondary}
                onClick={() => setGenerateModalOpen(true)}
                disabled={isGenerating}
              >
                <Sparkles size={16} /> {isGenerating ? 'Generating...' : 'AI Generate Deck'}
              </button>
              <button
                className={styles.actionBtnPrimary}
                onClick={() => setCreateModalOpen(true)}
              >
                <Plus size={16} /> Add Card
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className={styles.loadingState}>Loading flashcard review queue...</div>
          ) : dueFlashcards.length === 0 ? (
            <div className={styles.emptyState}>
              <BookOpen size={48} className={styles.emptyIcon} />
              <h3>No Flashcards In This Deck</h3>
              <p>Create your first flashcard manually or generate a deck with Gemini 2.0 Flash.</p>
              <button
                className={styles.actionBtnPrimary}
                onClick={() => setGenerateModalOpen(true)}
              >
                <Sparkles size={16} /> Generate With AI
              </button>
            </div>
          ) : reviewCompleted ? (
            <div className={styles.completionState}>
              <CheckCircle2 size={56} className={styles.checkIcon} />
              <h3>Review Session Complete!</h3>
              <p>You have reviewed all due cards for this session. Excellent recall discipline.</p>
              <button
                className={styles.actionBtnPrimary}
                onClick={() => fetchFlashcards()}
              >
                <RotateCw size={16} /> Review Again
              </button>
            </div>
          ) : (
            <div className={styles.reviewArena}>
              <div className={styles.cardCounter}>
                Card {currentCardIndex + 1} of {dueFlashcards.length}
                <span className={styles.topicBadge}>{activeCard?.topic || 'General'}</span>
              </div>

              {/* 3D Flip Card Container */}
              <div
                className={isFlipped ? `${styles.flashcardWrapper} ${styles.isFlipped}` : styles.flashcardWrapper}
                onClick={flipCard}
              >
                <div className={styles.flashcardInner}>
                  <div className={styles.flashcardFront}>
                    <div className={styles.cardHeaderSmall}>
                      <span>Question</span>
                      <span className={styles.flipHint}>Click card or Space to flip</span>
                    </div>
                    <div className={styles.cardContent}>{activeCard?.question}</div>
                  </div>
                  <div className={styles.flashcardBack}>
                    <div className={styles.cardHeaderSmall}>
                      <span>Answer</span>
                      <span className={styles.flipHint}>SM-2 Spaced Repetition</span>
                    </div>
                    <div className={styles.cardContent}>{activeCard?.answer}</div>
                  </div>
                </div>
              </div>

              {/* SM-2 Review Grade Controls */}
              {isFlipped ? (
                <div className={styles.sm2Controls}>
                  <p className={styles.sm2Prompt}>How well did you recall this concept?</p>
                  <div className={styles.gradeGrid}>
                    <button
                      className={`${styles.gradeBtn} ${styles.gradeAgain}`}
                      onClick={() => reviewCard(activeCard._id || activeCard.id, 0)}
                    >
                      <span>Again</span>
                      <small>&lt; 1 min</small>
                    </button>
                    <button
                      className={`${styles.gradeBtn} ${styles.gradeHard}`}
                      onClick={() => reviewCard(activeCard._id || activeCard.id, 3)}
                    >
                      <span>Hard</span>
                      <small>1 day</small>
                    </button>
                    <button
                      className={`${styles.gradeBtn} ${styles.gradeGood}`}
                      onClick={() => reviewCard(activeCard._id || activeCard.id, 4)}
                    >
                      <span>Good</span>
                      <small>3-6 days</small>
                    </button>
                    <button
                      className={`${styles.gradeBtn} ${styles.gradeEasy}`}
                      onClick={() => reviewCard(activeCard._id || activeCard.id, 5)}
                    >
                      <span>Easy</span>
                      <small>Interval x EF</small>
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.unflippedControls}>
                  <button className={styles.flipBtn} onClick={flipCard}>
                    Show Answer
                  </button>
                </div>
              )}

              <div className={styles.cardFooterActions}>
                <button
                  className={styles.deleteCardBtn}
                  onClick={() => deleteFlashcard(activeCard._id || activeCard.id)}
                  title="Delete this flashcard"
                >
                  <Trash2 size={15} /> Delete Card
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: YOUTUBE SUMMARIZER */}
      {activeTab === 'youtube' && (
        <div className={styles.youtubeSection}>
          <form onSubmit={handleYouTubeSubmit} className={styles.youtubeForm}>
            <div className={styles.inputGroup}>
              <Youtube className={styles.ytInputIcon} size={20} />
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Paste YouTube video or lecture URL (e.g. https://www.youtube.com/watch?v=...)"
                required
                className={styles.ytInput}
              />
            </div>
            <button
              type="submit"
              disabled={isSummarizing}
              className={styles.ytSubmitBtn}
            >
              <Sparkles size={16} />
              {isSummarizing ? 'Analyzing Lecture...' : 'Summarize Video'}
            </button>
          </form>

          {isSummarizing && (
            <div className={styles.analyzingCard}>
              <div className={styles.spinner} />
              <h4>Gemini 2.0 Flash is synthesizing the lecture...</h4>
              <p>Extracting high-yield concepts, viva study questions, and structured notes.</p>
            </div>
          )}

          {youtubeSummary && (
            <div className={styles.summaryResult}>
              <div className={styles.summaryHeader}>
                <div>
                  <h3 className={styles.summaryTitle}>{youtubeSummary.title}</h3>
                  <a
                    href={youtubeSummary.url || youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.videoLink}
                  >
                    Open on YouTube <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <div className={styles.summaryGrid}>
                <div className={styles.takeawaysBox}>
                  <h4>Key Conceptual Takeaways</h4>
                  <ul>
                    {youtubeSummary.keyTakeaways?.map((takeaway, idx) => (
                      <li key={idx}>{takeaway}</li>
                    ))}
                  </ul>
                </div>

                {youtubeSummary.studyQuestions && (
                  <div className={styles.questionsBox}>
                    <h4>Viva & Active Recall Questions</h4>
                    <div className={styles.questionList}>
                      {youtubeSummary.studyQuestions.map((q, idx) => (
                        <div key={idx} className={styles.questionItem}>
                          <strong>Q{idx + 1}: {q.question}</strong>
                          <p>{q.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FOCUS POMODORO TIMER */}
      {activeTab === 'pomodoro' && (
        <div className={styles.pomodoroSection}>
          <div className={styles.pomodoroCard}>
            <div className={styles.modeTabs}>
              <button
                className={timerMode === 'work' ? `${styles.modeBtn} ${styles.modeActive}` : styles.modeBtn}
                onClick={() => setTimerMode('work')}
              >
                Focus (25m)
              </button>
              <button
                className={timerMode === 'shortBreak' ? `${styles.modeBtn} ${styles.modeActive}` : styles.modeBtn}
                onClick={() => setTimerMode('shortBreak')}
              >
                Short Break (5m)
              </button>
              <button
                className={timerMode === 'longBreak' ? `${styles.modeBtn} ${styles.modeActive}` : styles.modeBtn}
                onClick={() => setTimerMode('longBreak')}
              >
                Long Break (15m)
              </button>
            </div>

            <div className={styles.timerDisplay}>{formatTimer(focusTimeLeft)}</div>

            <div className={styles.timerControls}>
              <button
                className={styles.playPauseBtn}
                onClick={() => setTimerRunning(!timerRunning)}
              >
                {timerRunning ? <Pause size={22} /> : <Play size={22} />}
                {timerRunning ? 'Pause Session' : 'Start Focus'}
              </button>
              <button className={styles.resetBtn} onClick={resetTimer}>
                <RotateCcw size={18} /> Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REMINDERS & WORKSPACE SESSIONS */}
      {activeTab === 'reminders' && (
        <div className={styles.remindersSection}>
          <div className={styles.remindersGrid}>
            {/* Reminders Column */}
            <div className={styles.columnBox}>
              <div className={styles.columnHeader}>
                <div>
                  <h3>Scheduled Reminders</h3>
                  <p>Study tasks and review alerts with quiet-hours suppression.</p>
                </div>
                <div className={styles.colActions}>
                  <button
                    className={styles.actionBtnSecondary}
                    onClick={() => setQuietHoursModalOpen(true)}
                    title="Configure Quiet Hours"
                  >
                    Quiet Hours
                  </button>
                  <button
                    className={styles.actionBtnPrimary}
                    onClick={() => setReminderModalOpen(true)}
                  >
                    <Plus size={14} /> Add Reminder
                  </button>
                </div>
              </div>

              <div className={styles.reminderList}>
                {reminders.length === 0 ? (
                  <div className={styles.emptyCard}>No active reminders scheduled.</div>
                ) : (
                  reminders.map((rem) => (
                    <div key={rem._id || rem.id} className={styles.reminderItem}>
                      <input
                        type="checkbox"
                        checked={rem.isCompleted}
                        onChange={(e) =>
                          toggleReminderComplete(rem._id || rem.id, e.target.checked)
                        }
                      />
                      <div className={styles.remContent}>
                        <h4 className={rem.isCompleted ? styles.completedText : ''}>
                          {rem.title}
                        </h4>
                        <span className={styles.remMeta}>
                          <Calendar size={12} /> {new Date(rem.remindAt).toLocaleString()}
                        </span>
                      </div>
                      <button
                        className={styles.delBtn}
                        onClick={() => deleteReminder(rem._id || rem.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Workspace Sessions Column */}
            <div className={styles.columnBox}>
              <div className={styles.columnHeader}>
                <div>
                  <h3>Workspace Sessions</h3>
                  <p>One-click multi-tab link launchers for targeted study sessions.</p>
                </div>
                <button
                  className={styles.actionBtnPrimary}
                  onClick={() => setSessionModalOpen(true)}
                >
                  <Plus size={14} /> New Session
                </button>
              </div>

              <div className={styles.sessionList}>
                {sessions.length === 0 ? (
                  <div className={styles.emptyCard}>No workspace link bundles saved.</div>
                ) : (
                  sessions.map((sess) => (
                    <div key={sess._id || sess.id} className={styles.sessionItem}>
                      <div className={styles.sessInfo}>
                        <h4>{sess.name}</h4>
                        {sess.description && <p>{sess.description}</p>}
                        <div className={styles.sessBadges}>
                          <span>{sess.links?.length || 0} links</span>
                        </div>
                      </div>
                      <div className={styles.sessActions}>
                        <button
                          className={styles.openBundleBtn}
                          onClick={() => {
                            sess.links?.forEach((link) => window.open(link.url, '_blank'));
                          }}
                        >
                          <ExternalLink size={14} /> Launch All
                        </button>
                        <button
                          className={styles.delBtn}
                          onClick={() => deleteSession(sess._id || sess.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE REMINDER MODAL */}
      {reminderModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setReminderModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Set Study Reminder</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!remTitle.trim() || !remDate) return;
                const ok = await createReminder({
                  title: remTitle.trim(),
                  remindAt: remDate,
                  itemType: remItemType,
                });
                if (ok) {
                  setRemTitle('');
                  setRemDate('');
                  setReminderModalOpen(false);
                }
              }}
              className={styles.modalForm}
            >
              <div className={styles.formGroup}>
                <label>Reminder Title</label>
                <input
                  type="text"
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  placeholder="e.g. Review Distributed Caching Flashcards"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Remind At</label>
                <input
                  type="datetime-local"
                  value={remDate}
                  onChange={(e) => setRemDate(e.target.value)}
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.actionBtnSecondary}
                  onClick={() => setReminderModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.actionBtnPrimary}>
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE WORKSPACE SESSION MODAL */}
      {sessionModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setSessionModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Save Workspace Session</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!sessName.trim()) return;
                const validLinks = sessLinks.filter((l) => l.title.trim() && l.url.trim());
                if (validLinks.length === 0) return;
                const ok = await createSession({
                  name: sessName.trim(),
                  description: sessDesc.trim(),
                  links: validLinks,
                });
                if (ok) {
                  setSessName('');
                  setSessDesc('');
                  setSessLinks([{ title: '', url: '' }]);
                  setSessionModalOpen(false);
                }
              }}
              className={styles.modalForm}
            >
              <div className={styles.formGroup}>
                <label>Session Name</label>
                <input
                  type="text"
                  value={sessName}
                  onChange={(e) => setSessName(e.target.value)}
                  placeholder="e.g. Daily Research Desk"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <input
                  type="text"
                  value={sessDesc}
                  onChange={(e) => setSessDesc(e.target.value)}
                  placeholder="Optional note about this workspace bundle"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Workspace Links</label>
                {sessLinks.map((link, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <input
                      type="text"
                      placeholder="Title"
                      value={link.title}
                      onChange={(e) => {
                        const updated = [...sessLinks];
                        updated[idx].title = e.target.value;
                        setSessLinks(updated);
                      }}
                      required
                    />
                    <input
                      type="url"
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) => {
                        const updated = [...sessLinks];
                        updated[idx].url = e.target.value;
                        setSessLinks(updated);
                      }}
                      required
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.actionBtnSecondary}
                  onClick={() => setSessLinks([...sessLinks, { title: '', url: '' }])}
                >
                  + Add Another Link
                </button>
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.actionBtnSecondary}
                  onClick={() => setSessionModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.actionBtnPrimary}>
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUIET HOURS MODAL */}
      {quietHoursModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setQuietHoursModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Notification Quiet Hours</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await updateQuietHours({
                  enabled: qhEnabled,
                  start: qhStart,
                  end: qhEnd,
                });
                setQuietHoursModalOpen(false);
              }}
              className={styles.modalForm}
            >
              <div className={styles.formGroup}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={qhEnabled}
                    onChange={(e) => setQhEnabled(e.target.checked)}
                  />
                  Enable Quiet Hours Suppression
                </label>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Start Time (HH:mm)</label>
                  <input
                    type="time"
                    value={qhStart}
                    onChange={(e) => setQhStart(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>End Time (HH:mm)</label>
                  <input
                    type="time"
                    value={qhEnd}
                    onChange={(e) => setQhEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.actionBtnSecondary}
                  onClick={() => setQuietHoursModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.actionBtnPrimary}>
                  Save Quiet Hours
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE FLASHCARD MODAL */}
      {createModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setCreateModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Add Flashcard</h3>
            <form onSubmit={handleCreateCard} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Topic / Deck</label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="e.g. Distributed Systems, Algorithms"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Question (Front)</label>
                <textarea
                  rows={3}
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="What is the difference between latency and throughput?"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Answer (Back)</label>
                <textarea
                  rows={4}
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Latency is the time delay for a request, while throughput is the total volume processed per unit time."
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.actionBtnSecondary}
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.actionBtnPrimary}>
                  Save Flashcard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATE DECK MODAL */}
      {generateModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setGenerateModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>
              <Sparkles size={18} /> Generate Deck with Gemini 2.0 Flash
            </h3>
            <form onSubmit={handleGenerateDeck} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Topic or Subject</label>
                <input
                  type="text"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="e.g. Raft Consensus Algorithm, React Fiber Architecture"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Card Count</label>
                <select
                  value={genCount}
                  onChange={(e) => setGenCount(Number(e.target.value))}
                >
                  <option value={3}>3 Cards</option>
                  <option value={5}>5 Cards</option>
                  <option value={10}>10 Cards</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.actionBtnSecondary}
                  onClick={() => setGenerateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className={styles.actionBtnPrimary}
                >
                  <Sparkles size={16} />
                  {isGenerating ? 'Synthesizing...' : 'Generate Deck'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
