import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ivy 藤学',
    short_name: 'ivy',
    description: 'Ivy 的语文学习助手 — 说话就能看到笔顺动画',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#1a1a1a',
    theme_color: '#1a1a1a',
    lang: 'zh-Hans',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
