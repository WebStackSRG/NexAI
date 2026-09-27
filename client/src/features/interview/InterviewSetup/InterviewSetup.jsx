import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Sparkles,
  Award,
  ChevronRight,
  Clock,
  Zap,
  Cpu,
  GraduationCap,
  Layers,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import styles from './InterviewSetup.module.scss';

const ROLE_PRESETS = [
  { id: 'Full-Stack Engineer', label: 'Full-Stack Engineer', icon: <Layers size={15} /> },
  { id: 'Frontend React', label: 'Frontend React', icon: <Zap size={15} /> },
  { id: 'Node.js Backend', label: 'Node.js Backend', icon: <Cpu size={15} /> },
  { id: 'System Design Architect', label: 'System Design', icon: <Sparkles size={15} /> },
  { id: 'MSBTE Capstone Viva', label: 'MSBTE Capstone Viva', icon: <GraduationCap size={15} /> },
];

const DIFFICULTY_LEVELS = [
  {
    id: 'junior',
    label: 'Junior / Student',
    desc: 'Core fundamentals, language mechanics, mental models & syntax',
  },
  {
    id: 'mid',
    label: 'Mid-Level',
    desc: 'System trade-offs, error handling, state synchronization & APIs',
  },
  {
    id: 'senior',
    label: 'Senior / Lead',
    desc: 'Scalability, distributed architecture, latency vs throughput & resilience',
  },
];

const TOPIC_SUGGESTIONS = [
  'MERN Stack Architecture & REST/WebSocket APIs',
  'React 19 Hooks, Fiber & Performance Optimization',
  'Microservices, Distributed Caching & Database Indexing',
  'MSBTE Capstone Viva Defense & System Justification',
];

export function InterviewSetup({
  role,
  difficulty,
  topic,
  selectedModel,
  onRoleChange,
  onDifficultyChange,
  onTopicChange,
  onModelChange,
  onStart,
  isStarting = false,
  sessions = [],
  onSelectSession,
}) {
  const [customRoleMode, setCustomRoleMode] = useState(
    !ROLE_PRESETS.some((p) => p.id === role),
  );

  const handlePresetRole = (presetId) => {
    setCustomRoleMode(false);
    onRoleChange(presetId);
  };

  const handleCustomRoleToggle = () => {
    setCustomRoleMode(true);
    if (ROLE_PRESETS.some((p) => p.id === role)) {
      onRoleChange('');
    }
  };

  return (
    <div className={styles.setupContainer}>
      <div className={styles.mainGrid}>
        {/* Left Column: Setup Config Form */}
        <div className={styles.configColumn}>
          <Card className={styles.setupCard} padding="lg">
            <div className={styles.headerArea}>
              <div className={styles.badgeWrapper}>
                <Badge variant="accent" size="md">
                  <Sparkles size={13} />
                  Interactive Simulation
                </Badge>
              </div>
              <h2 className={styles.title}>Configure Mock Interview</h2>
              <p className={styles.subtitle}>
                Simulate high-stakes technical screening and academic viva defense with a senior AI interviewer.
              </p>
            </div>

            {/* Target Role Selection */}
            <div className={styles.formSection}>
              <label className={styles.sectionLabel}>1. Target Role & Persona</label>
              <div className={styles.presetGrid}>
                {ROLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={cn(
                      styles.presetBtn,
                      !customRoleMode && role === preset.id && styles.active,
                    )}
                    onClick={() => handlePresetRole(preset.id)}
                  >
                    <span className={styles.presetIcon}>{preset.icon}</span>
                    <span className={styles.presetLabel}>{preset.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  className={cn(styles.presetBtn, customRoleMode && styles.active)}
                  onClick={handleCustomRoleToggle}
                >
                  <span className={styles.presetIcon}>✏️</span>
                  <span className={styles.presetLabel}>Custom Role</span>
                </button>
              </div>

              {customRoleMode && (
                <div className={styles.customInputWrapper}>
                  <Input
                    placeholder="Enter custom role (e.g. Flutter Mobile Dev, DevOps Lead)"
                    value={role}
                    onChange={(e) => onRoleChange(e.target.value)}
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Difficulty Level Selection */}
            <div className={styles.formSection}>
              <label className={styles.sectionLabel}>2. Seniority Level</label>
              <div className={styles.difficultyGrid}>
                {DIFFICULTY_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    className={cn(
                      styles.difficultyBtn,
                      difficulty === level.id && styles.active,
                    )}
                    onClick={() => onDifficultyChange(level.id)}
                  >
                    <div className={styles.difficultyHeader}>
                      <span className={styles.difficultyName}>{level.label}</span>
                      {difficulty === level.id && (
                        <span className={styles.activeCheck}>✓</span>
                      )}
                    </div>
                    <span className={styles.difficultyDesc}>{level.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Focus Topic Input & Suggestions */}
            <div className={styles.formSection}>
              <label className={styles.sectionLabel}>3. Focus Topic / Tech Stack</label>
              <Input
                placeholder="e.g. Distributed Database Sharding, React Virtual DOM, Next.js App Router"
                value={topic}
                onChange={(e) => onTopicChange(e.target.value)}
              />

              <div className={styles.suggestionsContainer}>
                <span className={styles.suggestionTitle}>Suggestions:</span>
                <div className={styles.topicChips}>
                  {TOPIC_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      className={cn(
                        styles.topicChip,
                        topic === sug && styles.activeChip,
                      )}
                      onClick={() => onTopicChange(sug)}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Model Tier Selector */}
            <div className={styles.formSection}>
              <label className={styles.sectionLabel}>4. AI Interviewer Model</label>
              <div className={styles.modelRow}>
                <button
                  type="button"
                  className={cn(
                    styles.modelOption,
                    selectedModel === 'flash' && styles.active,
                  )}
                  onClick={() => onModelChange('flash')}
                >
                  <Zap size={16} />
                  <div>
                    <span className={styles.modelTitle}>Gemini Flash (Recommended)</span>
                    <span className={styles.modelSub}>Ultra-fast real-time speech responses</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={cn(
                    styles.modelOption,
                    selectedModel === 'pro' && styles.active,
                  )}
                  onClick={() => onModelChange('pro')}
                >
                  <Sparkles size={16} />
                  <div>
                    <span className={styles.modelTitle}>Gemini Pro</span>
                    <span className={styles.modelSub}>Deep multi-turn architectural viva probing</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Start CTA */}
            <div className={styles.ctaRow}>
              <Button
                variant="primary"
                size="lg"
                className={styles.startBtn}
                onClick={onStart}
                disabled={!role.trim() || !topic.trim() || isStarting}
                loading={isStarting}
                leftIcon={<Play size={18} />}
              >
                Enter Simulation Arena
              </Button>

              <span className={styles.meteringNotice}>
                ⚡ Real-time AI interviewer metered with credits (~1-2 credits/turn)
              </span>
            </div>
          </Card>
        </div>

        {/* Right Column: History & Past Sessions */}
        <div className={styles.historyColumn}>
          <Card className={styles.historyCard} padding="lg">
            <div className={styles.historyHeader}>
              <h3 className={styles.historyTitle}>
                <Clock size={16} />
                Recent Simulations
              </h3>
              <span className={styles.historyCount}>{sessions.length} sessions</span>
            </div>

            {sessions.length === 0 ? (
              <EmptyState
                icon={<Award size={36} />}
                title="No Interviews Yet"
                description="Configure your target role and seniority to begin your first interactive interview."
              />
            ) : (
              <div className={styles.sessionsList}>
                {sessions.map((sess) => {
                  const isCompleted = sess.status === 'completed';
                  const score = sess.scorecard?.overallScore;
                  return (
                    <div
                      key={sess._id}
                      className={styles.sessionItem}
                      onClick={() => onSelectSession(sess._id)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className={styles.sessionMain}>
                        <div className={styles.sessionTop}>
                          <span className={styles.sessionRole}>{sess.role}</span>
                          {isCompleted && score !== undefined ? (
                            <Badge
                              variant={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger'}
                              size="sm"
                            >
                              {score}/100
                            </Badge>
                          ) : (
                            <Badge variant="accent" size="sm">
                              In Progress
                            </Badge>
                          )}
                        </div>
                        <p className={styles.sessionTopic} title={sess.topic}>
                          {sess.topic}
                        </p>
                        <div className={styles.sessionMeta}>
                          <span className={styles.metaPill}>{sess.difficulty}</span>
                          <span className={styles.metaDate}>{formatDate(sess.createdAt)}</span>
                        </div>
                      </div>

                      <div className={styles.sessionArrow}>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

InterviewSetup.propTypes = {
  role: PropTypes.string.isRequired,
  difficulty: PropTypes.oneOf(['junior', 'mid', 'senior']).isRequired,
  topic: PropTypes.string.isRequired,
  selectedModel: PropTypes.oneOf(['flash', 'pro']).isRequired,
  onRoleChange: PropTypes.func.isRequired,
  onDifficultyChange: PropTypes.func.isRequired,
  onTopicChange: PropTypes.func.isRequired,
  onModelChange: PropTypes.func.isRequired,
  onStart: PropTypes.func.isRequired,
  isStarting: PropTypes.bool,
  sessions: PropTypes.array,
  onSelectSession: PropTypes.func.isRequired,
};
