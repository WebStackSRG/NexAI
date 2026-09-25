import { cn } from '@/lib/utils/cn';
import styles from './Card.module.scss';

export function Card({ children, padding = 'md', interactive = false, className, onClick, ...props }) {
  return (
    <div
      className={cn(styles.card, styles[`p-${padding}`], interactive && styles.interactive, className)}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.(e);
              }
            }
          : undefined
      }
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ children, className, ...props }) {
  return (
    <div className={cn(styles.header, className)} {...props}>
      {children}
    </div>
  );
};

Card.Body = function CardBody({ children, className, ...props }) {
  return (
    <div className={cn(styles.body, className)} {...props}>
      {children}
    </div>
  );
};

Card.Footer = function CardFooter({ children, className, ...props }) {
  return (
    <div className={cn(styles.footer, className)} {...props}>
      {children}
    </div>
  );
};
