import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';

@Component({
  selector: 'm-card-product-skeleton',
  templateUrl: './card-product-skeleton.component.html',
  styleUrl: './card-product-skeleton.component.scss',
  imports: [SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-adaptive]': 'adaptive() || null',
  },
})
export class CardProductSkeletonComponent {
  readonly adaptive = input(true);
}
