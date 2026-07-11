/*
 * EN: Guard against the deprecated `::ng-deep` (and `/deep/`, `>>>`) shadow-
 *     piercing combinators in stylesheets. ESLint can't lint SCSS, so this
 *     script is the enforcement equivalent: it walks each project's src/ for
 *     *.scss / *.css and fails (non-zero exit) if any piercing combinator is
 *     found. Wired via `npm run lint:styles` (part of `npm run lint`).
 * RU: Защита от устаревшего `::ng-deep` (и `/deep/`, `>>>`) в стилях. ESLint не
 *     проверяет SCSS, поэтому этот скрипт — эквивалент правила: обходит src/
 *     каждого проекта и завершается с ошибкой, если найден пробивающий комбинатор.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = [
  'projects/mobile-market-app/src',
  'projects/mobile-market-admin/src',
  'projects/mobile-market-shared/src',
];
const PATTERN = /::ng-deep|\/deep\/|>>>/;
const offenders = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      walk(path);
    } else if (/\.(scss|css)$/.test(entry)) {
      readFileSync(path, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (PATTERN.test(line)) offenders.push(`${path}:${i + 1}  ${line.trim()}`);
        });
    }
  }
}

for (const root of ROOTS) {
  if (existsSync(root)) walk(root);
}

if (offenders.length > 0) {
  console.error('✖ Forbidden shadow-piercing combinator (::ng-deep / /deep/ / >>>):\n');
  console.error(offenders.join('\n'));
  console.error(
    '\nMove third-party component overrides to the project styles.scss (global, no encapsulation),\n' +
      'or use ViewEncapsulation.None on a dedicated wrapper component. ::ng-deep is deprecated.',
  );
  process.exit(1);
}

console.log('✓ No ::ng-deep usage found.');
