import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { useTheme } from '@/hooks/useTheme';

export default function SettingsPage() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your appearance, model preferences, and workspace defaults."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 640 }}>
        <Card padding="md">
          <Card.Header>
            <h3 style={{ fontSize: 'var(--text-md)' }}>Appearance</h3>
          </Card.Header>
          <Card.Body>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-2) 0',
              }}
            >
              <div>
                <div style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)' }}>
                  Dark Theme
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  Switch between dark and light appearance modes
                </div>
              </div>
              <Switch checked={isDark} onChange={toggleTheme} aria-label="Toggle dark theme" />
            </div>
          </Card.Body>
        </Card>

        <Card padding="md">
          <Card.Header>
            <h3 style={{ fontSize: 'var(--text-md)' }}>AI Preferences</h3>
          </Card.Header>
          <Card.Body style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Select
              label="Default Model"
              value="flash"
              onChange={() => {}}
              options={[
                { value: 'flash', label: 'Gemini 1.5 Flash (Fast & Cost Efficient)' },
                { value: 'pro', label: 'Gemini 1.5 Pro (Deep Reasoning & Analysis)' },
              ]}
              hint="Flash consumes significantly fewer credits per request."
            />
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
