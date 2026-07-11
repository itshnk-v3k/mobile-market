import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type TagSize = 'sm' | 'md';

@Component({
  selector: 'm-tag',
  templateUrl: './tag.component.html',
  styleUrl: './tag.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-size]': 'size()',
  },
})
export class TagComponent {
  readonly size = input<TagSize>('md');
}
