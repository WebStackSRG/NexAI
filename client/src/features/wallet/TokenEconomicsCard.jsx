import { Coins, Cpu, ShieldCheck, Scale } from 'lucide-react';
import styles from './TokenEconomicsCard.module.scss';

export function TokenEconomicsCard() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.iconCircle}>
          <Coins size={18} />
        </div>
        <div>
          <h3 className={styles.title}>Token &amp; Credit Economics</h3>
          <p className={styles.subtitle}>
            How AI computational usage is metered, calculated, and billed in real time.
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.pillar}>
          <div className={styles.pillarHeader}>
            <Scale size={16} className={styles.pillarIcon} />
            <span className={styles.pillarTitle}>Metered Formula</span>
          </div>
          <div className={styles.formulaBox}>
            <code>credits = Math.ceil(totalTokens / 100)</code>
          </div>
          <p className={styles.pillarText}>
            Every token returned by Gemini `usageMetadata` is accounted for. 100 tokens = 1 credit.
          </p>
        </div>

        <div className={styles.pillar}>
          <div className={styles.pillarHeader}>
            <Cpu size={16} className={styles.pillarIcon} />
            <span className={styles.pillarTitle}>Model Consumption</span>
          </div>
          <p className={styles.pillarText}>
            <strong>Gemini Flash:</strong> Ultra-fast &amp; economical for regular chat queries and auto-tagging.<br />
            <strong>Gemini Pro:</strong> High precision for deep technical reasoning and document drafting.
          </p>
        </div>

        <div className={styles.pillar}>
          <div className={styles.pillarHeader}>
            <ShieldCheck size={16} className={styles.pillarIcon} />
            <span className={styles.pillarTitle}>Zero-Deficit Gatekeeping</span>
          </div>
          <p className={styles.pillarText}>
            Pre-flight `creditCheck` middleware halts calls at 0 credits with HTTP 402. Database deductions are atomic via `$inc`.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TokenEconomicsCard;
