import type { LucideIconData } from '@lucide/angular';

/**
 * Brand / social icons. Lucide deprecated and removed its brand icons
 * (facebook, instagram, youtube — see lucide-icons/lucide#670, which recommends
 * simpleicons.org). To keep the footer's social links rendering unchanged after
 * the move to `@lucide/angular`, they are preserved here as custom
 * `LucideIconData` (node paths taken from the former lucide brand icons) and
 * registered alongside the standard icons via `provideLucideIcons`.
 */

export const Facebook: LucideIconData = {
  name: 'facebook',
  node: [['path', { d: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' }]],
};

export const Instagram: LucideIconData = {
  name: 'instagram',
  node: [
    ['rect', { width: '20', height: '20', x: '2', y: '2', rx: '5', ry: '5' }],
    ['path', { d: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z' }],
    ['line', { x1: '17.5', x2: '17.51', y1: '6.5', y2: '6.5' }],
  ],
};

export const Youtube: LucideIconData = {
  name: 'youtube',
  node: [
    [
      'path',
      {
        d: 'M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17',
      },
    ],
    ['path', { d: 'm10 15 5-3-5-3z' }],
  ],
};
