import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { transform } from '@shared/utils/merge-classes';
import type { ClassValue } from 'clsx';

import { BtnLoaderComponent } from './btn-loader/btn-loader.component';

type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'danger-outline'
  | 'text'
  | 'text-accent';

type ButtonCorners = 'square' | 'rounded';
type ButtonView = 'content' | 'icon';

const ICON_SIZES: Record<ButtonSize, number> = {
  sm: 16,
  md: 18,
  lg: 20,
  xl: 24,
};

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[mButton], a[mButton]',
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  imports: [BtnLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.disabled]': 'disabled() || null',
    '[attr.data-size]': 'size()',
    '[attr.data-view]': 'view()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-corners]': 'corners()',
    '[attr.data-loading]': 'loading() || null',
    '[attr.data-full]': 'full()',
    '(click)': 'onClickHandler($event)',
  },
})
export class ButtonComponent {
  readonly size = input<ButtonSize>('md');
  readonly view = input<ButtonView>('content');
  readonly variant = input<ButtonVariant>('primary');
  readonly corners = input<ButtonCorners>('square');
  readonly loading = input(false, { transform });
  readonly disabled = input(false, { transform });
  readonly full = input<boolean>(false);
  readonly class = input<ClassValue>('');

   
  readonly onClick = output<Event>();

  readonly isIconOnly = computed(() => this.view() === 'icon');
  readonly isContent = computed(() => this.view() === 'content');

  readonly iconSize = computed(() => ICON_SIZES[this.size()] ?? 18);

  protected readonly onClickHandler = ($event: Event) => {
    if (!this.disabled() && !this.loading()) {
       
      this.onClick.emit($event);
    }
  };
}
