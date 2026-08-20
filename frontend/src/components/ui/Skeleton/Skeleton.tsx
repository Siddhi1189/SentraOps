import type React from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({ width, height, borderRadius, className }: SkeletonProps) {
  const style: React.CSSProperties = {
    width: width ?? '100%',
    height: height ?? '1rem',
    borderRadius: borderRadius,
  };

  return <div className={`${styles.skeleton} ${className || ''}`} style={style} />;
}
