import { cn } from '@/lib/utils/cn';
import styles from './Skeleton.module.scss';

export function Skeleton({ width, height, radius = 'md', className, style, ...props }) {
  const isNamedRadius = ['sm', 'md', 'lg', 'full'].includes(radius);

  return (
    <span
      className={cn(styles.skeleton, isNamedRadius && styles[`radius-${radius}`], className)}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: !isNamedRadius && radius ? radius : undefined,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}
