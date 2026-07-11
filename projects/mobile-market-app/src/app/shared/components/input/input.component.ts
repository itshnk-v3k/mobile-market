import type {
  OnInit} from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  forwardRef,
  inject,
  Injector,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type {
  ControlValueAccessor,
  FormControl,
  FormControlName} from '@angular/forms';
import {
  FormGroupDirective,
  FormsModule,
  NG_VALUE_ACCESSOR,
  NgControl,
} from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { ValidationErrorMessagesService } from '@shared/services/validation-error-messages.service.ts/validation-error-messages.service.ts.component';
import { generateId, mergeClasses } from '@shared/utils/merge-classes';
import { NgxMaskDirective } from 'ngx-mask';

export type InputType = 'text' | 'email' | 'password' | 'tel' | 'number' | 'search';
export type InputSize = 'sm' | 'md' | 'lg';
type InputStatus = 'base' | 'error';

@Component({
  selector: 'm-input',
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NgxMaskDirective, LucideDynamicIcon],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  host: {
    '[attr.data-size]': 'size()',
    '[attr.data-status]': 'inputStatus()',
    '[attr.data-disabled]': 'disabledState() || null',
  },
})
export class InputComponent implements ControlValueAccessor, OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  readonly validationErrorMessage = inject(ValidationErrorMessagesService);

  private readonly startSlot = contentChild('start');

  readonly id = input(generateId('input'));
  readonly type = input<InputType>('text');
  readonly size = input<InputSize>('md');
  readonly mask = input('');
  readonly label = input('');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly defaultValue = input('');
  readonly disabled = input(false);
  readonly readOnly = input(false);
  readonly autocomplete = input('off');

  readonly hasStartSlot = computed(() => !!this.startSlot());

  readonly changed = output<string>();
  readonly focused = output<void>();

  readonly inputStatus = signal<InputStatus>('base');
  readonly showPassword = signal(false);

  protected readonly value = signal('');
  protected readonly disabledState = signal(false);

  public control: FormControl | null = null;

  get inputType(): string {
    if (this.type() !== 'password') return this.type();
    return this.showPassword() ? 'text' : 'password';
  }

  protected readonly wrapClasses = computed(() =>
    mergeClasses('input-wrap', this.inputStatus() === 'error' && 'input-wrap-error')
  );

  ngOnInit(): void {
    this.value.set(this.defaultValue());

    const ngControl = this.injector.get(NgControl, null);

    if (ngControl) {
      this.control =
        this.injector.get(FormGroupDirective, null)?.getControl(ngControl as FormControlName) ??
        null;
    }

    if (this.control) {
      this.control.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        if (this.control?.touched) {
          this.inputStatus.set(this.control.invalid ? 'error' : 'base');
        }
      });
    }
  }

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledState.set(isDisabled);
  }

  protected onBlur(): void {
    this.onTouched();
    this.inputStatus.set(this.control?.invalid ? 'error' : 'base');
  }

  protected onInputChange(event: Event): void {
    if (this.disabled()) return;
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChange(this.value());
    this.changed.emit(this.value());
  }
}
