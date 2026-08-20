import styles from './TopologyLayerCard.module.css';

interface TopologyLayerCardProps {
  index: string;
  label: string;
  title: string;
  description: string;
  isHighlighted?: boolean;
}

export function TopologyLayerCard({
  index,
  label,
  title,
  description,
  isHighlighted = false,
}: TopologyLayerCardProps) {
  return (
    <div className={`${styles.card} ${isHighlighted ? styles.cardHighlighted : ''}`}>
      <span className={styles.label}>
        {index} / {label}
      </span>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
