import PropTypes from 'prop-types';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Bookmark,
  FileText,
  Terminal,
  Search,
  Wallet,
  Settings,
  Shield,
  Sparkles,
  Layers,
  LogOut,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { CreditBadge } from '@/components/common/CreditBadge';
import { Dropdown } from '@/components/ui/Dropdown';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils/cn';
import styles from './Sidebar.module.scss';

export function Sidebar({ onItemClick }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const navItems = [
    { to: ROUTES.CHAT, label: 'Chat', icon: <MessageSquare size={18} /> },
    { to: ROUTES.LIBRARY, label: 'Library', icon: <Bookmark size={18} /> },
    { to: ROUTES.DOCUMENTS, label: 'Documents', icon: <FileText size={18} /> },
    { to: ROUTES.PROMPTS, label: 'Prompt Vault', icon: <Terminal size={18} /> },
    { to: ROUTES.SEARCH, label: 'Search', icon: <Search size={18} /> },
    { to: ROUTES.WALLET, label: 'Wallet', icon: <Wallet size={18} /> },
    { to: ROUTES.SETTINGS, label: 'Settings', icon: <Settings size={18} /> },
    { to: ROUTES.ADMIN, label: 'Admin', icon: <Shield size={18} /> },
  ];

  // Dev-only Design System Link
  if (import.meta.env.DEV) {
    navItems.push({
      to: ROUTES.DESIGN_SYSTEM,
      label: 'Design System',
      icon: <Layers size={18} />,
    });
  }

  const credits = user?.wallet?.creditsRemaining ?? 100;
  const userDisplayName = user?.email ? user.email.split('@')[0] : 'User';
  const userPlan =
    user?.role === 'admin'
      ? 'Admin'
      : user?.wallet?.tier === 'pro_monthly'
        ? 'Pro Tier'
        : 'Free Tier';

  const userMenuItems = [
    {
      label: 'Settings',
      icon: <Settings size={16} />,
      onClick: () => navigate(ROUTES.SETTINGS),
    },
    { divider: true },
    {
      label: 'Sign Out',
      icon: <LogOut size={16} />,
      danger: true,
      onClick: async () => {
        await logout();
        navigate(ROUTES.LOGIN);
      },
    },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logoIcon}>
          <Sparkles size={16} />
        </div>
        <span>NexAI</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onItemClick}
            className={({ isActive }) => cn(styles.navItem, isActive && styles.active)}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <CreditBadge credits={credits} />
        <Dropdown
          trigger={
            <div
              className={styles.userCard}
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer', width: '100%' }}
            >
              <Avatar name={user?.email || 'User'} size="sm" />
              <div className={styles.userInfo}>
                <span className={styles.name}>{userDisplayName}</span>
                <span className={styles.role}>{userPlan}</span>
              </div>
            </div>
          }
          items={userMenuItems}
          align="left"
        />
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  onItemClick: PropTypes.func,
};
