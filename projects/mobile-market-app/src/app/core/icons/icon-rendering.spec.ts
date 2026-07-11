import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LucideDynamicIcon, provideLucideIcons } from '@lucide/angular';

import { APP_ICONS } from './icons';

// Verifies the @lucide/angular migration renders real inline SVG: a standard
// lucide icon (heart, shopping-cart), a dynamically-bound name, and a custom
// brand icon (facebook, which lucide removed) all resolve from the
// provideLucideIcons(APP_ICONS) registration and emit SVG child nodes.
@Component({
  standalone: true,
  imports: [LucideDynamicIcon],
  template: `
    <svg lucideIcon="heart" [size]="24" data-testid="heart"></svg>
    <svg lucideIcon="shopping-cart" data-testid="cart"></svg>
    <svg [lucideIcon]="dynamicName" data-testid="dynamic"></svg>
    <svg lucideIcon="facebook" data-testid="facebook"></svg>
  `,
})
class IconHostComponent {
  readonly dynamicName = 'search';
}

describe('icon rendering (@lucide/angular)', () => {
  function render() {
    TestBed.configureTestingModule({
      imports: [IconHostComponent],
      providers: [provideLucideIcons(...Object.values(APP_ICONS))],
    });
    const fixture = TestBed.createComponent(IconHostComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders each registered icon as an <svg> with drawable child nodes', () => {
    const el = render();
    const svgs = el.querySelectorAll('svg[lucideIcon], svg[ng-reflect-lucide-icon], svg');
    expect(svgs.length).toBe(4);
    for (const id of ['heart', 'cart', 'dynamic', 'facebook']) {
      const svg = el.querySelector(`[data-testid="${id}"]`) as SVGElement | null;
      expect(svg).not.toBeNull();
      const drawn = svg!.querySelectorAll('path, rect, line, circle, polyline, polygon');
      expect(drawn.length).toBeGreaterThan(0);
    }
  });

  it('applies the size input to the svg', () => {
    const el = render();
    const heart = el.querySelector('[data-testid="heart"]') as SVGElement;
    expect(heart.getAttribute('width')).toBe('24');
    expect(heart.getAttribute('height')).toBe('24');
  });
});
