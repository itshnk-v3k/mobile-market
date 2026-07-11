import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeVariant = 'new' | 'sale' | 'used' | 'hot' | 'popular' | 'out-of-stock';
export type BadgeSize = 'sm' | 'md';

@Component({
  selector: 'm-badge',
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
  },
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('new');
  readonly size = input<BadgeSize>('md');
}
