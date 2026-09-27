import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';

export default function SettingsPage() {
  const { isDark, toggleTheme } = useTheme();
  const { user, updateSettings } = useAuthStore();

  const currentModel = user?.settings?.defaultModel || 'flash';
  const webSearchDefaultOn = user?.settings?.webSearchDefaultOn || false;

  const handleThemeChange = async () => {
    toggleTheme();
    const nextTheme = isDark ? 'light' : 'dark';
    if (user) {
      await updateSettings({ theme: nextTheme });
    }
  };

  const handleModelChange = async (e) => {
    const newModel = e.target.value;
    const res = await updateSettings({ defaultModel: newModel });
    if (res.success) {
      toast.success('Default model preference updated');
    } else {
      toast.error('Failed to update preference');
    }
  };

  const handleWebSearchToggle = async () => {
    const res = await updateSettings({ webSearchDefaultOn: !webSearchDefaultOn });
    if (res.success) {
      toast.success('Web search default updated');
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your appearance, model preferences, and workspace defaults."
      />

      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: 640 }}
      >
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
              <Switch
                checked={isDark}
                onChange={handleThemeChange}
                aria-label="Toggle dark theme"
              />
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
              value={currentModel}
              onChange={handleModelChange}
              options={[
                { value: 'flash', label: 'Gemini 1.5 Flash (Fast & Cost Efficient)' },
                { value: 'pro', label: 'Gemini 1.5 Pro (Deep Reasoning & Analysis)' },
              ]}
              hint="Flash consumes significantly fewer credits per request."
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 'var(--space-2)',
              }}
            >
              <div>
                <div style={{ fontWeight: 'var(--weight-medium)', fontSize: 'var(--text-sm)' }}>
                  Default Web Search
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  Automatically search the web when answering relevant queries
                </div>
              </div>
              <Switch
                checked={webSearchDefaultOn}
                onChange={handleWebSearchToggle}
                aria-label="Toggle web search default"
              />
            </div>
          </Card.Body>
        </Card>

        <Card padding="md">
          <Card.Header>
            <h3 style={{ fontSize: 'var(--text-md)' }}>Account Details</h3>
          </Card.Header>
          <Card.Body>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Email:{' '}
              <strong style={{ color: 'var(--color-text-primary)' }}>{user?.email || 'N/A'}</strong>
            </div>
            <div
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                marginTop: 'var(--space-2)',
              }}
            >
              Role:{' '}
              <strong style={{ color: 'var(--color-text-primary)' }}>{user?.role || 'user'}</strong>
            </div>
            <div
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                marginTop: 'var(--space-2)',
              }}
            >
              Credits:{' '}
              <strong style={{ color: 'var(--color-accent)' }}>
                {user?.wallet?.creditsRemaining ?? 0}
              </strong>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
