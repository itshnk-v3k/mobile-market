import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'm-skeleton',
  template: `
    <div class="skeleton"></div>
  `,
  styleUrl: './skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {}
