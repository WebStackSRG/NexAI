import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils/cn';
import styles from './Dropdown.module.scss';

export function Dropdown({ trigger, items = [], align = 'right', className }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const [flyoutCoords, setFlyoutCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      if (containerRef.current && align === 'flyout') {
        const rect = containerRef.current.getBoundingClientRect();
        
        // If trigger has scrolled completely off-screen, auto-close
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          setOpen(false);
          return;
        }

        const menuHeight = menuRef.current?.offsetHeight || (items.length * 36 + 24);
        const menuWidth = menuRef.current?.offsetWidth || 210;
        const wouldOverflowRight = rect.right + menuWidth + 8 > window.innerWidth;

        if (wouldOverflowRight) {
          // If screen is narrow (e.g. mobile drawer), place to the left of the button or below
          const left = Math.max(12, rect.right - menuWidth);
          let top = rect.bottom + 4;
          if (top + menuHeight > window.innerHeight - 12) {
            top = Math.max(12, rect.top - menuHeight - 4);
          }
          setFlyoutCoords({ top, left });
        } else {
          // Desktop sidebar: float to the right side of the button into the workspace
          let top = rect.top - 4;
          // Ensure it NEVER hides or gets clipped underneath the bottom:
          if (top + menuHeight > window.innerHeight - 12) {
            top = Math.max(12, window.innerHeight - menuHeight - 12);
          }
          setFlyoutCoords({
            top,
            left: rect.right + 6,
          });
        }
      }
    };

    updatePosition();
    const rafId = requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    const handleClickOutside = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        !menuRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, align, items.length]);

  const menuElement = (
    <div
      ref={menuRef}
      className={cn(
        styles.menu,
        align === 'left' && styles['align-left'],
        align === 'top-left' && styles['align-top-left'],
        align === 'flyout' && styles['align-flyout'],
      )}
      style={
        align === 'flyout'
          ? {
              position: 'fixed',
              top: `${flyoutCoords.top}px`,
              left: `${flyoutCoords.left}px`,
              right: 'auto',
              width: 'max-content',
              minWidth: '185px',
              maxWidth: '260px',
              maxHeight: 'calc(100vh - 24px)',
              overflowY: 'auto',
              zIndex: 9999,
            }
          : undefined
      }
      role="menu"
      aria-orientation="vertical"
    >
      {items.map((item, index) => {
        if (item.divider) {
          return <div key={index} className={styles.divider} role="separator" />;
        }

        if (item.header) {
          return (
            <div key={index} className={styles.header}>
              {item.label}
            </div>
          );
        }

        return (
          <button
            key={index}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              setOpen(false);
              item.onClick?.();
            }}
            className={cn(styles.item, item.danger && styles.danger, item.active && styles.active)}
          >
            {item.icon && (
              <span className={styles.itemIcon} aria-hidden="true">
                {item.icon}
              </span>
            )}
            <span className={styles.itemLabel}>{item.label}</span>
            {item.badge && <span className={styles.itemBadge}>{item.badge}</span>}
            {item.trailing && <span className={styles.itemTrailing}>{item.trailing}</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={cn(styles.container, open && styles.isOpen, className)}
      data-dropdown-open={open ? 'true' : undefined}
    >
      <div onClick={() => setOpen((prev) => !prev)}>{trigger}</div>

      {open && (align === 'flyout' ? createPortal(menuElement, document.body) : menuElement)}
    </div>
  );
}

Dropdown.propTypes = {
  trigger: PropTypes.node.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      icon: PropTypes.node,
      trailing: PropTypes.node,
      badge: PropTypes.string,
      header: PropTypes.bool,
      divider: PropTypes.bool,
      danger: PropTypes.bool,
      active: PropTypes.bool,
      disabled: PropTypes.bool,
      onClick: PropTypes.func,
    }),
  ).isRequired,
  align: PropTypes.oneOf(['right', 'left', 'flyout', 'top-left']),
  className: PropTypes.string,
};
