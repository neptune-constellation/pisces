<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import appleIcon from '@lysun001/pisces-assets/svg/apple.svg';
import linuxIcon from '@lysun001/pisces-assets/svg/linux.svg';
import windowsIcon from '@lysun001/pisces-assets/svg/windows.svg';

/**
 * Platform download buttons for the desktop app.
 *
 * Rendered in two places: through the theme's `home-hero-after` slot on the home
 * page (with `heading`), and inline on the desktop page, where the surrounding
 * `## Installing` heading already provides the context. Both locales share this
 * component, so the labels follow the active page language.
 */
defineProps<{
  /** Render a title above the grid. Used on the home page, which has no section heading. */
  heading?: boolean;
}>();

const REPO = 'https://github.com/neptune-constellation/pisces';

const { lang } = useData();

const isZh = computed(() => lang.value.startsWith('zh'));

const title = computed(() => (isZh.value ? '下载桌面端' : 'Download the desktop app'));

/**
 * Asset names must match the `artifactName` templates in
 * `apps/desktop/electron-builder.yml` — they are deliberately version-less so
 * these `releases/latest/download/...` links survive every release.
 *
 * The icons are single-colour SVGs with a hard-coded dark `fill`, so they are
 * painted through a CSS mask instead of being inlined — that keeps their colour
 * following the theme in dark mode (see `.pisces-download__glyph`).
 */
const targets = [
  { os: 'Windows', note: 'x64', file: 'Pisces-Setup.exe', icon: windowsIcon },
  { os: 'macOS', note: 'Apple Silicon', file: 'Pisces-arm64.dmg', icon: appleIcon },
  { os: 'Linux', note: 'x64', file: 'Pisces-x64.AppImage', icon: linuxIcon },
];

const assetUrl = (file: string): string => `${REPO}/releases/latest/download/${file}`;

/**
 * Builds the `mask-image` source for an icon.
 *
 * The URL must be wrapped in double quotes: Vite inlines the smaller icons as
 * `data:` URIs, and those contain single quotes (`version='1.0'`), which are not
 * valid characters inside an unquoted `url()` token — the whole declaration
 * would be dropped and the icon would not render.
 */
const glyphStyle = (icon: string): Record<string, string> => ({
  '--pisces-glyph': `url("${icon}")`,
});
</script>

<template>
  <section
    :id="heading ? 'download' : undefined"
    class="pisces-download"
    :class="{ 'pisces-download--home': heading }"
  >
    <p v-if="heading" class="pisces-download__title">{{ title }}</p>
    <div class="pisces-download__grid">
      <a
        v-for="target in targets"
        :key="target.file"
        class="pisces-download__card"
        :href="assetUrl(target.file)"
      >
        <span class="pisces-download__badge" aria-hidden="true">
          <span class="pisces-download__glyph" :style="glyphStyle(target.icon)" />
        </span>
        <span class="pisces-download__body">
          <span class="pisces-download__os">
            {{ target.os }}<span class="pisces-download__note">{{ target.note }}</span>
          </span>
          <span class="pisces-download__file">{{ target.file }}</span>
        </span>
      </a>
    </div>
  </section>
</template>

<style scoped>
.pisces-download {
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 24px;
}

.pisces-download--home {
  margin-bottom: 48px;
}

.pisces-download__title {
  margin: 0 0 16px;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.4;
  text-align: center;
  color: var(--vp-c-text-1);
}

.pisces-download__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 12px;
}

.pisces-download__card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background-color: var(--vp-c-bg-soft);
  text-decoration: none;
  transition:
    border-color 0.25s,
    background-color 0.25s,
    box-shadow 0.25s,
    transform 0.25s;
}

.pisces-download__card:hover {
  border-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-alt);
  box-shadow: 0 6px 18px rgb(0 0 0 / 8%);
  transform: translateY(-2px);
  text-decoration: none;
}

.pisces-download__badge {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.pisces-download__glyph {
  width: 22px;
  height: 22px;
  background-color: currentColor;
  mask-image: var(--pisces-glyph);
  mask-position: center;
  mask-repeat: no-repeat;
  mask-size: contain;
  -webkit-mask-image: var(--pisces-glyph);
  -webkit-mask-position: center;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
}

.pisces-download__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pisces-download__os {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--vp-c-text-1);
}

.pisces-download__note {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.pisces-download__file {
  overflow: hidden;
  font-size: 12px;
  line-height: 1.35;
  color: var(--vp-c-text-2);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
