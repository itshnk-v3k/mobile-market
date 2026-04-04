import type {
  OnInit} from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
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
  FormControlName} from '@angular/forms';
import {
  type ControlValueAccessor,
  type FormControl,
  FormGroupDirective,
  FormsModule,
  NG_VALUE_ACCESSOR,
  NgControl,
} from '@angular/forms';
import { ValidationErrorMessagesService } from '@shared/services/validation-error-messages.service.ts/validation-error-messages.service.ts.component';
import { generateId } from '@shared/utils/merge-classes';
import { NgxMaskDirective } from 'ngx-mask';

type TextareaStatus = 'base' | 'error';

@Component({
  selector: 'm-textarea',
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NgxMaskDirective],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],
  host: {
    '[attr.data-disabled]': 'disabledState() || null',
    '[attr.data-status]': 'inputStatus()',
  },
})
export class TextareaComponent implements ControlValueAccessor, OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  readonly validationErrorMessage = inject(ValidationErrorMessagesService);

  readonly id = input(generateId('textarea'));
  readonly label = input('');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly rows = input(3);
  readonly mask = input('');
  readonly disabled = input(false);
  readonly readOnly = input(false);

  readonly changed = output<string>();

  protected readonly value = signal('');
  protected readonly disabledState = signal(false);
  protected readonly inputStatus = signal<TextareaStatus>('base');

  public control: FormControl | null = null;

   
  private onChange: (v: string) => void = () => {};
   
  private onTouched: () => void = () => {};

  ngOnInit(): void {
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

  writeValue(val: string | null): void {
    this.value.set(val ?? '');
  }

  registerOnChange(fn: (v: string) => void): void {
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
    const val = (event.target as HTMLTextAreaElement).value;
    this.value.set(val);
    this.onChange(val);
    this.changed.emit(val);
  }
}
