import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import type { ControlValueAccessor} from '@angular/forms';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { RadioComponent } from '../radio/radio.component';

export interface RadioOption {
  label: string;
  value: unknown;
  disabled?: boolean;
}

@Component({
  selector: 'm-radio-group',
  templateUrl: './radio-group.component.html',
  styleUrl: './radio-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RadioComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroupComponent),
      multi: true,
    },
  ],
  host: {
    role: 'radiogroup',
  },
})
export class RadioGroupComponent implements ControlValueAccessor {
  readonly name = input('');
  readonly label = input('');
  readonly options = input<RadioOption[]>([]);
  readonly labelPosition = input<'before' | 'after'>('after');

  readonly changed = output<unknown>();

  protected readonly value = signal<unknown>(null);
  protected readonly disabledState = signal(false);

  private onChange: (v: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: unknown): void {
    this.value.set(val ?? null);
  }

  registerOnChange(fn: (v: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledState.set(isDisabled);
  }

  protected select(val: unknown): void {
    if (this.disabledState()) return;

    this.value.set(val);
    this.onTouched();
    this.onChange(val);
    this.changed.emit(val);
  }
}
