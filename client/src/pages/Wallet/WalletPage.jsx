import { Wallet, Zap } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function WalletPage() {
  return (
    <div>
      <PageHeader
        title="Wallet &amp; Billing"
        description="Transparent, utility-metered credit ledger backed by token usage."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <Card padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Available Credits
            </span>
            <Badge tone="accent">Active</Badge>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-3)',
            }}
          >
            <span style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>
              100
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              credits
            </span>
          </div>
          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              marginTop: 'var(--space-2)',
            }}
          >
            1 credit ≈ 100 API tokens consumed
          </p>
        </Card>

        <Card padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Recharge Options
            </span>
            <Badge tone="success">Test Mode</Badge>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-3)',
              marginTop: 'var(--space-4)',
              flexWrap: 'wrap',
            }}
          >
            <Button variant="secondary" size="sm">
              ₹49 / 500 Credits
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Zap size={14} />}>
              ₹99 / 1,200 Credits
            </Button>
          </div>
        </Card>
      </div>

      <Card padding="md">
        <Card.Header>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Wallet size={18} />
            <h3 style={{ fontSize: 'var(--text-md)' }}>Recent Transactions</h3>
          </div>
        </Card.Header>
        <Card.Body>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            No transactions yet. Recharge your account using Razorpay test mode.
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}
