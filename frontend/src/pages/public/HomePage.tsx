import { PublicNavbar } from '../../features/public-site/components/PublicNavbar';
import { ProductHero } from '../../features/public-site/components/ProductHero';
import { TrustStatsBar } from '../../features/public-site/components/TrustStatsBar';
import { CapabilityStory } from '../../features/public-site/components/CapabilityStory';
import { EditorialStatement } from '../../features/public-site/components/EditorialStatement';
import { PricingSection } from '../../features/public-site/components/PricingSection';
import { TestimonialCard } from '../../features/public-site/components/TestimonialCard';
import { FaqAccordion } from '../../features/public-site/components/FaqAccordion';
import { FinalCTA } from '../../features/public-site/components/FinalCTA';
import { PublicFooter } from '../../features/public-site/components/PublicFooter';
import styles from './HomePage.module.css';

export function HomePage() {
  return (
    <div className={styles.pageWrapper}>
      <PublicNavbar />
      <main className={styles.mainContent}>
        {/* 1. Hero with Dashboard Preview Mockup */}
        <ProductHero />

        {/* 2. Full-Width Dark Navy Trust Stats Strip */}
        <TrustStatsBar />

        {/* 3. What You Can Do With SentraOps 8-Feature Grid */}
        <CapabilityStory />

        {/* 4. Why SentraOps? Card with Custom Illustration & Checklist */}
        <EditorialStatement />

        {/* 5. Plans & Pricing with Monthly/Yearly Toggle */}
        <PricingSection />

        {/* 6. Bottom 3-Column Section: Testimonial, FAQ, and Final CTA */}
        <section className={styles.bottomSection}>
          <div className={styles.container}>
            <div className={styles.bottomThreeColGrid}>
              <TestimonialCard />
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
