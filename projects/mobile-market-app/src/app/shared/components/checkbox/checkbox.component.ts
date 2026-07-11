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
import { LucideAngularModule } from 'lucide-angular';

export type CheckboxSize = 'sm' | 'md' | 'lg';
export type CheckboxState = 'default' | 'indeterminate';
export type CheckboxForm = 'square' | 'circle';

const ICON_SIZE: Record<CheckboxSize, number> = {
  sm: 12,
  md: 14,
  lg: 16,
};

@Component({
  selector: 'm-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
  host: {
    '[attr.data-size]': 'size()',
    '[attr.data-disabled]': 'disabledState() || null',
  },
})
export class CheckboxComponent implements ControlValueAccessor {
  readonly id = input(generateId('checkbox'));
  readonly size = input<CheckboxSize>('md');
  readonly state = input<CheckboxState>('default');
  readonly form = input<CheckboxForm>('square');
  readonly label = input('');

  readonly checkChange = output<boolean>();

  readonly checked = model<boolean>(false);
  protected readonly disabledState = signal(false);

  protected readonly iconSize = computed(() => ICON_SIZE[this.size()]);
  protected readonly iconName = computed(() =>
    this.state() === 'indeterminate' ? 'minus' : 'check'
  );
  protected readonly ariaChecked = computed(() =>
    this.state() === 'indeterminate' ? 'mixed' : String(this.checked())
  );
  protected readonly isChecked = computed(() => this.checked() || this.state() === 'indeterminate');

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: boolean): void {
    this.checked.set(val ?? false);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledState.set(isDisabled);
  }

  protected onToggle(): void {
    if (this.disabledState() || this.state() === 'indeterminate') {
      this.checked.set(true);
    } else {
      this.checked.update(v => !v);
    }
    this.onTouched();
    this.onChange(this.checked());
    this.checkChange.emit(this.checked());
  }
}
