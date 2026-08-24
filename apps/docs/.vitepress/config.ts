import { defineConfig } from 'vitepress';

/**
 * VitePress configuration for the pisces documentation site.
 *
 * English is the root locale; Chinese lives under /zh/. The site is deployed
 * to GitHub Pages at https://neptune-constellation.github.io/pisces/, hence
 * the /pisces/ base path.
 */
export default defineConfig({
  title: 'pisces',
  description: 'A terminal launcher for AI coding agents.',
  base: '/pisces/',
  cleanUrls: true,
  lastUpdated: true,

  locales: {
    root: {
      label: 'English',
      lang: 'en',
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      description: 'AI 编程代理的终端启动器。',
      themeConfig: {
        nav: [
          { text: '指南', link: '/zh/install' },
          { text: '参考', link: '/zh/config' },
          { text: 'FAQ', link: '/zh/faq' },
        ],
        sidebar: [
          {
            text: '入门',
            items: [
              { text: '安装', link: '/zh/install' },
              { text: '快速开始', link: '/zh/quickstart' },
            ],
          },
          {
            text: '参考',
            items: [
              { text: '配置', link: '/zh/config' },
              { text: '搜索与键盘', link: '/zh/search' },
              { text: '子目录浏览', link: '/zh/subdirs' },
              { text: '自我更新', link: '/zh/update' },
            ],
          },
          {
            text: '帮助',
            items: [{ text: '常见问题', link: '/zh/faq' }],
          },
        ],
        outline: { label: '本页目录' },
        docFooter: { prev: '上一页', next: '下一页' },
        lastUpdated: { text: '最后更新' },
        darkModeSwitchLabel: '外观',
        sidebarMenuLabel: '菜单',
        returnToTopLabel: '返回顶部',
        langMenuLabel: '语言',
      },
    },
  },

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/install' },
      { text: 'Reference', link: '/config' },
      { text: 'FAQ', link: '/faq' },
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Installation', link: '/install' },
          { text: 'Quick Start', link: '/quickstart' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Configuration', link: '/config' },
          { text: 'Search & Keyboard', link: '/search' },
          { text: 'Subdirectory Browsing', link: '/subdirs' },
          { text: 'Self-Update', link: '/update' },
        ],
      },
      {
        text: 'Help',
        items: [{ text: 'FAQ', link: '/faq' }],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/neptune-constellation/pisces' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/@lysun001/pisces' },
    ],
    search: {
      provider: 'local',
    },
    editLink: {
      pattern: 'https://github.com/neptune-constellation/pisces/edit/main/apps/docs/:path',
    },
  },
});
