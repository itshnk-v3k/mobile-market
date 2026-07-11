import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'm-loader',
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-size]': 'size()',
  },
})
export class LoaderComponent {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
}
