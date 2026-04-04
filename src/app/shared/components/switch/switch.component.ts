import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { generateId } from '@shared/utils/merge-classes';

export type SwitchSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'm-switch',
  templateUrl: './switch.component.html',
  styleUrl: './switch.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SwitchComponent),
      multi: true,
    },
  ],
  host: {
    '[attr.data-size]': 'size()',
    '[attr.data-disabled]': 'disabledState() || null',
  },
})
export class SwitchComponent implements ControlValueAccessor {
  readonly id = input(generateId('switch'));
  readonly size = input<SwitchSize>('md');
  readonly label = input('');

  readonly checked = model<boolean>(false);
  readonly switchChange = output<boolean>();

  protected readonly disabledState = signal(false);
  protected readonly state = computed(() => (this.checked() ? 'checked' : 'unchecked'));
  protected readonly ariaChecked = computed(() => String(this.checked()));

   
  private onChange: (v: boolean) => void = () => {};
   
  private onTouched: () => void = () => {};

  writeValue(val: boolean): void {
    this.checked.set(val ?? false);
  }

  registerOnChange(fn: (v: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledState.set(isDisabled);
  }

  protected onToggle(): void {
    if (this.disabledState()) return;
    this.checked.update(v => !v);
    this.onTouched();
    this.onChange(this.checked());
    this.switchChange.emit(this.checked());
  }
}
