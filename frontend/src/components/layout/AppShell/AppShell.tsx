import { Navigation } from '../Navigation/Navigation';
import { MainContent } from '../MainContent/MainContent';
import styles from './AppShell.module.css';

export function AppShell() {
  return (
    <div className={styles.shell}>
      <Navigation />
      <div className={styles.mainLayout}>
        <MainContent />
      </div>
    </div>
  );
}
