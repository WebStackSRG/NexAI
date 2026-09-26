import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CreditCard, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import {
  InterviewSetup,
  InterviewArena,
  Scorecard,
} from '@/features/interview';
import { useInterviewStore } from '@/store/interviewStore';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes';
import styles from './InterviewPage.module.scss';

export default function InterviewPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const creditsRemaining = user?.wallet?.creditsRemaining ?? 0;

  const {
    currentSession,
    messages,
    scorecard,
    archivedLibraryItem,
    isStarting,
    isStreaming,
    isConcluding,
    insufficientCredits,
    role,
    difficulty,
    topic,
    selectedModel,
    sessions,
    isListening,
    setIsListening,
    isSpeaking,
    speakingSource,
    isTtsEnabled,
    setSetupField,
    startInterview,
    sendResponse,
    stopStreaming,
    concludeInterview,
    resetSession,
    fetchSessions,
    loadSession,
    toggleTts,
    speakInterviewerText,
  } = useInterviewStore();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleStart = () => {
    startInterview({
      role,
      difficulty,
      topic,
      model: selectedModel,
    });
  };

  const handleRechargeClick = () => {
    navigate(ROUTES.WALLET);
  };

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title="AI Mock Interview Platform"
        subtitle="Simulate technical screenings and viva defense with real-time speech visualizer and automated competency scorecards."
        actions={
          <div className={styles.headerActions}>
            <div className={styles.creditPill} onClick={handleRechargeClick} role="button" tabIndex={0}>
              <CreditCard size={14} />
              <span>{creditsRemaining} credits</span>
            </div>
            {currentSession && (
              <Button variant="ghost" size="sm" onClick={resetSession} className={styles.exitBtn}>
                <RotateCcw size={14} />
                Exit Simulation
              </Button>
            )}
          </div>
        }
      />

      {/* Insufficient credits warning banner */}
      {(insufficientCredits || (creditsRemaining <= 0 && !currentSession)) && (
        <div className={styles.warningBanner}>
          <div className={styles.warningLeft}>
            <AlertCircle size={18} className={styles.warningIcon} />
            <div>
              <strong className={styles.warningTitle}>Credit Balance Depleted</strong>
              <p className={styles.warningText}>
                Mock interview simulations require token metering. Recharge your wallet to continue.
              </p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={handleRechargeClick}>
            Recharge Credits
          </Button>
        </div>
      )}

      {/* Main Content View Switcher */}
      <div className={styles.contentArea}>
        {scorecard ? (
          <Scorecard
            session={currentSession}
            scorecard={scorecard}
            archivedLibraryItem={archivedLibraryItem}
            onReset={resetSession}
          />
        ) : currentSession ? (
          <InterviewArena
            session={currentSession}
            messages={messages}
            isStreaming={isStreaming}
            isConcluding={isConcluding}
            onSendResponse={sendResponse}
            onStopStreaming={stopStreaming}
            onConclude={concludeInterview}
            onReset={resetSession}
            isListening={isListening}
            setIsListening={setIsListening}
            isSpeaking={isSpeaking}
            speakingSource={speakingSource}
            isTtsEnabled={isTtsEnabled}
            onToggleTts={toggleTts}
            onSpeakText={speakInterviewerText}
          />
        ) : (
          <InterviewSetup
            role={role}
            difficulty={difficulty}
            topic={topic}
            selectedModel={selectedModel}
            onRoleChange={(val) => setSetupField('role', val)}
            onDifficultyChange={(val) => setSetupField('difficulty', val)}
            onTopicChange={(val) => setSetupField('topic', val)}
            onModelChange={(val) => setSetupField('selectedModel', val)}
            onStart={handleStart}
            isStarting={isStarting}
            sessions={sessions}
            onSelectSession={loadSession}
          />
        )}
      </div>
    </div>
  );
}
