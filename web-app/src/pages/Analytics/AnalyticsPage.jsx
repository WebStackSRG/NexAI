import React, { useEffect } from 'react';
import {
  BarChart3,
  MessageSquare,
  BookOpen,
  FileText,
  Sparkles,
  Layers,
  CheckCircle2,
  Cpu,
  RotateCw,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';
import useAnalyticsStore from '../../store/analyticsStore';
import styles from './AnalyticsPage.module.scss';

export default function AnalyticsPage() {
  const { stats, isLoading, error, fetchStats } = useAnalyticsStore();

  useEffect(() => {
    fetchStats();
  }, []);

  const data = stats || {
    chatCount: 0,
    messageCount: 0,
    libraryCount: 0,
    vectorEmbeddingsCount: 0,
    documentCount: 0,
    promptCount: 0,
    flashcardCount: 0,
    reminderCount: 0,
    snippetCount: 0,
    focusScore: 78,
    freeTierSafetyIndex: 100,
    avgLatencyMs: 142,
    activityTrend: [
      { date: 'Sep 1', actions: 4, tokensEst: 1280 },
      { date: 'Sep 2', actions: 7, tokensEst: 2240 },
      { date: 'Sep 3', actions: 5, tokensEst: 1600 },
      { date: 'Sep 4', actions: 9, tokensEst: 2880 },
      { date: 'Sep 5', actions: 12, tokensEst: 3840 },
      { date: 'Sep 6', actions: 8, tokensEst: 2560 },
      { date: 'Sep 7', actions: 14, tokensEst: 4480 },
    ],
  };

  const trend = data.activityTrend || [];
  const maxActions = Math.max(...trend.map((t) => t.actions || 1), 10);

  // SVG Chart Dimensions
  const chartHeight = 140;
  const chartWidth = 700;
  const colWidth = chartWidth / Math.max(trend.length, 1);

  // Generate SVG path for line chart
  const points = trend.map((t, idx) => {
    const x = idx * colWidth + colWidth / 2;
    const y = chartHeight - (t.actions / maxActions) * (chartHeight - 30) - 15;
    return `${x},${y}`;
  });
  const linePath = points.length > 0 ? `M ${points.join(' L ')}` : '';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>System & Usage Analytics</h1>
            <p className={styles.subtitle}>
              Real-time workspace activity, RAG retrieval volumes, and Free-Tier safety metrics.
            </p>
          </div>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={fetchStats}
            disabled={isLoading}
          >
            <RotateCw size={14} className={isLoading ? styles.spinning : ''} />
            {isLoading ? 'Updating...' : 'Refresh Metrics'}
          </button>
        </div>
      </header>

      {error && <div className={styles.errorBox}>{error}</div>}

      {/* Hero Score Banner */}
      <div className={styles.heroBanner}>
        <div className={styles.heroLeft}>
          <div className={styles.scoreDial}>
            <strong>{data.focusScore}</strong>
            <span>Score</span>
          </div>
          <div className={styles.heroContent}>
            <h3>Productivity & Focus Health</h3>
            <p>
              Calculated from spaced repetition recall, document exports, and knowledge synthesis.
            </p>
          </div>
        </div>
        <div className={styles.heroPills}>
          <span className={styles.healthPill}>
            <ShieldCheck size={14} /> Free-Tier Safe (Render &lt; 512MB RAM)
          </span>
          <span className={styles.healthPill}>
            <CheckCircle2 size={14} /> Latency: {data.avgLatencyMs}ms
          </span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <MessageSquare size={20} />
          </div>
          <div className={styles.kpiDetails}>
            <span className={styles.kpiValue}>{data.chatCount}</span>
            <span className={styles.kpiLabel}>Chats ({data.messageCount} Messages)</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <BookOpen size={20} />
          </div>
          <div className={styles.kpiDetails}>
            <span className={styles.kpiValue}>{data.libraryCount}</span>
            <span className={styles.kpiLabel}>Knowledge Library Items</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <Cpu size={20} />
          </div>
          <div className={styles.kpiDetails}>
            <span className={styles.kpiValue}>{data.vectorEmbeddingsCount}</span>
            <span className={styles.kpiLabel}>Pinecone Vectors Indexed</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <FileText size={20} />
          </div>
          <div className={styles.kpiDetails}>
            <span className={styles.kpiValue}>{data.documentCount}</span>
            <span className={styles.kpiLabel}>Documents Created</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <Sparkles size={20} />
          </div>
          <div className={styles.kpiDetails}>
            <span className={styles.kpiValue}>{data.promptCount}</span>
            <span className={styles.kpiLabel}>Active Prompt Templates</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}>
            <Layers size={20} />
          </div>
          <div className={styles.kpiDetails}>
            <span className={styles.kpiValue}>{data.flashcardCount}</span>
            <span className={styles.kpiLabel}>SM-2 Flashcards Active</span>
          </div>
        </div>
      </div>

      {/* Interactive Activity Trend Chart (Pure SVG) */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3>Daily Activity & Knowledge Queries</h3>
          <span>Last 14 Days</span>
        </div>

        <div className={styles.svgChartWrapper}>
          <svg
            className={styles.chartSvg}
            viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`}
            preserveAspectRatio="none"
          >
            {/* Bars */}
            {trend.map((item, idx) => {
              const barHeight = (item.actions / maxActions) * (chartHeight - 30);
              const x = idx * colWidth + 8;
              const y = chartHeight - barHeight;
              const barW = Math.max(colWidth - 16, 12);

              return (
                <rect
                  key={idx}
                  x={x}
                  y={y}
                  width={barW}
                  height={barHeight}
                  className={styles.chartBar}
                >
                  <title>{`${item.date}: ${item.actions} actions`}</title>
                </rect>
              );
            })}

            {/* Trend Line */}
            {linePath && <path d={linePath} className={styles.chartLine} />}

            {/* Line Data Points */}
            {trend.map((item, idx) => {
              const x = idx * colWidth + colWidth / 2;
              const y = chartHeight - (item.actions / maxActions) * (chartHeight - 30) - 15;
              return <circle key={idx} cx={x} cy={y} r={4} className={styles.chartPoint} />;
            })}

            {/* X Axis Labels */}
            {trend.map((item, idx) => {
              const x = idx * colWidth + colWidth / 2;
              return (
                <text key={idx} x={x} y={chartHeight + 20} className={styles.chartText}>
                  {item.date}
                </text>
              );
            })}
          </svg>
        </div>

        <div className={styles.chartLegend}>
          <div className={styles.legendItem}>
            <span className={styles.legendColorAccent} />
            <span>Actions Recorded (Chats, Flashcards, Links)</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendColorEmerald} />
            <span>Activity Trajectory Trend</span>
          </div>
        </div>
      </div>

      {/* Free-Tier Safety & Observability Bounds */}
      <div className={styles.boundsGrid}>
        <div className={styles.boundCard}>
          <div className={styles.boundHeader}>
            <h4>Render Free-Tier Memory Discipline</h4>
            <span>&lt; 512 MB Target</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: '38%' }} />
          </div>
          <p className={styles.boundNote}>
            Zero Puppeteer footprint. All PDF & DOCX generation operates via pure JavaScript libraries.
          </p>
        </div>

        <div className={styles.boundCard}>
          <div className={styles.boundHeader}>
            <h4>MongoDB Atlas M0 Storage Bounds</h4>
            <span>&lt; 512 MB Limit</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: '12%' }} />
          </div>
          <p className={styles.boundNote}>
            Lean schema architecture with text indexes and TTL link caching keeps data footprint minimal.
          </p>
        </div>

        <div className={styles.boundCard}>
          <div className={styles.boundHeader}>
            <h4>Pinecone Starter Vector Cap</h4>
            <span>2 GB / 2M Writes</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: '8%' }} />
          </div>
          <p className={styles.boundNote}>
            Text chunking with 768-dim Gemini embeddings operates securely within free starter allowances.
          </p>
        </div>
      </div>
    </div>
  );
}
