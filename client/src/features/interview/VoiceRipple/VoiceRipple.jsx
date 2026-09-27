import PropTypes from 'prop-types';
import { Mic, Bot, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import styles from './VoiceRipple.module.scss';

export function VoiceRipple({
  isSpeaking = false,
  source = 'idle', // 'candidate' | 'interviewer' | 'idle'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  statusText = '',
}) {
  const isInterviewer = source === 'interviewer';
  const isCandidate = source === 'candidate';

  const getAccessibleLabel = () => {
    if (!isSpeaking) return 'Standby - Listening for speech or response';
    if (isInterviewer) return 'Interviewer speaking';
    if (isCandidate) return 'Candidate speaking into microphone';
    return 'Speech activity detected';
  };

  return (
    <div
      className={cn(
        styles.rippleContainer,
        styles[size],
        isSpeaking && styles.active,
        isInterviewer && styles.interviewer,
        isCandidate && styles.candidate,
        className,
      )}
      role="region"
      aria-label={getAccessibleLabel()}
      aria-live="polite"
    >
      {/* Concentric ripple rings with staggered hardware-accelerated animations */}
      <div className={cn(styles.rippleRing, styles.ring1)} aria-hidden="true" />
      <div className={cn(styles.rippleRing, styles.ring2)} aria-hidden="true" />
      <div className={cn(styles.rippleRing, styles.ring3)} aria-hidden="true" />
      <div className={cn(styles.rippleRing, styles.ring4)} aria-hidden="true" />

      {/* Central Interactive Orb */}
      <div className={styles.centerOrb} aria-hidden="true">
        {isInterviewer ? (
          <Bot size={size === 'lg' ? 36 : size === 'sm' ? 20 : 28} className={styles.orbIcon} />
        ) : isCandidate ? (
          <Mic size={size === 'lg' ? 36 : size === 'sm' ? 20 : 28} className={styles.orbIcon} />
        ) : (
          <Volume2 size={size === 'lg' ? 36 : size === 'sm' ? 20 : 28} className={styles.orbIcon} />
        )}

        {/* Dynamic Mini Waveform Bars */}
        {isSpeaking && (
          <div className={styles.waveBars} aria-hidden="true">
            <span className={styles.bar} />
            <span className={styles.bar} />
            <span className={styles.bar} />
            <span className={styles.bar} />
            <span className={styles.bar} />
          </div>
        )}
      </div>

      {statusText && <span className={styles.statusLabel}>{statusText}</span>}
    </div>
  );
}

VoiceRipple.propTypes = {
  isSpeaking: PropTypes.bool,
  source: PropTypes.oneOf(['candidate', 'interviewer', 'idle']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
  statusText: PropTypes.string,
};
