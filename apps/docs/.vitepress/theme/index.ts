import type { App } from 'vue';
import { h } from 'vue';
import DefaultTheme from 'vitepress/theme';
import DownloadButtons from './components/DownloadButtons.vue';
import './custom.css';

export default {
  extends: DefaultTheme,

  /**
   * Injects the platform download buttons right below the home hero, so the
   * downloads are visible on the landing page instead of only on /desktop.
   */
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'home-hero-after': () => h(DownloadButtons, { heading: true }),
    });
  },

  /** Registers the same component for use in markdown (`<DownloadButtons />`). */
  enhanceApp({ app }: { app: App }) {
    app.component('DownloadButtons', DownloadButtons);
  },
};
