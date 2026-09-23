import { NavLink } from 'react-router-dom';
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
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { CreditBadge } from '@/components/common/CreditBadge';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils/cn';
import styles from './Sidebar.module.scss';

export function Sidebar({ onItemClick }) {
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
        <CreditBadge credits={100} />
        <div className={styles.userCard}>
          <Avatar name="User" size="sm" />
          <div className={styles.userInfo}>
            <span className={styles.name}>Demo User</span>
            <span className={styles.role}>Starter Plan</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
