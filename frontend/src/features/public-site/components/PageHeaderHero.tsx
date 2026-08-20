import styles from './PageHeaderHero.module.css';

interface PageHeaderHeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  variant?: 'white' | 'navy' | 'mist';
}

export function PageHeaderHero({ eyebrow, title, subtitle, variant = 'white' }: PageHeaderHeroProps) {
  const variantClass = styles[variant] || styles.white;

  return (
    <section className={`${styles.heroSection} ${variantClass}`}>
      <div className={styles.container}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          <span>{eyebrow}</span>
        </div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
    </section>
  );
}
