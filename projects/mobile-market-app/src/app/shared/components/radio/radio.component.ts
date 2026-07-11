import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { generateId } from '@shared/utils/merge-classes';

@Component({
  selector: 'm-radio',
  templateUrl: './radio.component.html',
  styleUrl: './radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-checked]': 'checked()',
    '[attr.data-disabled]': 'disabled() || null',
  },
})
export class RadioComponent {
  readonly id = input(generateId('radio'));
  readonly name = input('');
  readonly value = input<unknown>();
  readonly checked = input(false);
  readonly disabled = input(false);
  readonly labelPosition = input<'before' | 'after'>('after');

  readonly radioChange = output<unknown>();

  protected onToggle(): void {
    if (this.disabled() || this.checked()) return;
    this.radioChange.emit(this.value());
  }
}
