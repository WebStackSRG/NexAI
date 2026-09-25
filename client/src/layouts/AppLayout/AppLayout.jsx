import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Drawer } from '@/components/ui/Drawer';
import { Spinner } from '@/components/ui/Spinner';
import { CommandPalette } from '@/features/command-palette';
import { useUiStore } from '@/store/uiStore';
import styles from './AppLayout.module.scss';

export function AppLayout() {
  const isDrawerOpen = useUiStore((state) => state.isDrawerOpen);
  const setDrawerOpen = useUiStore((state) => state.setDrawerOpen);

  return (
    <div className={styles.layout}>
      {/* Desktop Sidebar */}
      <div className={styles.desktopSidebar}>
        <Sidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      <Drawer
        open={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="NexAI"
        side="left"
      >
        <Sidebar onItemClick={() => setDrawerOpen(false)} />
      </Drawer>

      <div className={styles.mainWrapper}>
        <Topbar />
        <main className={styles.content}>
          <Suspense
            fallback={
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                <Spinner size="lg" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}
