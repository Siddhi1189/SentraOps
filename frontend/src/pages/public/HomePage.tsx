import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PublicNavbar } from '../../features/public-site/components/PublicNavbar';
import { ProductHero } from '../../features/public-site/components/ProductHero';
import { CapabilityStory } from '../../features/public-site/components/CapabilityStory';
import { EditorialStatement } from '../../features/public-site/components/EditorialStatement';
import { FaqAccordion } from '../../features/public-site/components/FaqAccordion';
import { FinalCTA } from '../../features/public-site/components/FinalCTA';
import { PublicFooter } from '../../features/public-site/components/PublicFooter';
import styles from './HomePage.module.css';

export function HomePage() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = decodeURIComponent(location.hash.replace(/^#/, ''));
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView();
      }
    }
  }, [location]);

  return (
    <div className={styles.pageWrapper}>
      <PublicNavbar />
      <main className={styles.mainContent}>
        {/* 1. Hero with Dashboard Preview Mockup */}
        <ProductHero />

        {/* 2. What You Can Do With SentraOps 8-Feature Grid */}
        <CapabilityStory />

        {/* 3. Why SentraOps? Card with Custom Illustration & Checklist */}
        <EditorialStatement />

        {/* 4. Bottom 2-Column Section: FAQ and Final CTA */}
        <section className={styles.bottomSection}>
          <div className={styles.container}>
            <div className={styles.bottomGrid}>
              <FaqAccordion />
              <FinalCTA />
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
