'use client';

import dynamic from 'next/dynamic';
import styles from './page.module.css';

const GameCanvas = dynamic(() => import('../game/GameCanvas').then(mod => mod.GameCanvas), {
  ssr: false
});

export default function HomePage() {
  return (
    <main className={styles.container}>
      <GameCanvas />
      <section className={styles.uiLayer}>
        <header className={styles.header}>
          <h1>Eldergrove Legends</h1>
          <p>Wander the ancient forest, forge alliances, and reclaim the heart of Eldergrove.</p>
          <div className={styles.statsRow}>
            <span id="ui-health" />
          </div>
        </header>
        <article className={styles.dialogueBox}>
          <div id="ui-dialogue-text" />
          <div id="ui-dialogue-choices" />
        </article>
        <aside className={styles.questJournal}>
          <h2>Quest Log</h2>
          <ul id="ui-quest-log" />
        </aside>
        <aside className={styles.inventoryPanel}>
          <h2>Inventory</h2>
          <ul id="ui-inventory" />
        </aside>
      </section>
    </main>
  );
}
