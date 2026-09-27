import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card } from '@/components/ui/Card';
import styles from './ModelSplitChart.module.scss';

const COLORS = ['#10b981', '#8b5cf6'];

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipTitle}>{item.name}</p>
        <p className={styles.tooltipValue}>
          <strong>{Number(item.value).toLocaleString()} tokens</strong>
        </p>
      </div>
    );
  }
  return null;
}

export function ModelSplitChart({ data = [], featureSplit = [] }) {
  const chartData = data.map((d) => ({
    name: d.name,
    value: d.tokens,
    percentage: d.percentage,
  }));

  const totalTokens = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Model Distribution</h3>
        <p className={styles.subtitle}>Gemini Flash vs Gemini Pro consumption split</p>
      </div>

      <div className={styles.content}>
        <div className={styles.pieContainer}>
          {totalTokens === 0 ? (
            <div className={styles.empty}>No tokens consumed</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={styles.legend}>
          {chartData.map((item, index) => (
            <div key={item.name} className={styles.legendItem}>
              <div className={styles.legendLeft}>
                <span
                  className={styles.indicator}
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className={styles.legendName}>{item.name}</span>
              </div>
              <div className={styles.legendRight}>
                <span className={styles.legendPercent}>{item.percentage}%</span>
                <span className={styles.legendTokens}>
                  {Number(item.value).toLocaleString()} tokens
                </span>
              </div>
            </div>
          ))}
        </div>

        {featureSplit.length > 0 && (
          <div className={styles.featuresList}>
            <div className={styles.featuresTitle}>Feature Breakdown</div>
            <div className={styles.featureTags}>
              {featureSplit.map((f) => (
                <div key={f.feature} className={styles.featureBadge}>
                  <span className={styles.featureName}>{f.feature}</span>
                  <span className={styles.featureTokens}>{Number(f.tokens).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
