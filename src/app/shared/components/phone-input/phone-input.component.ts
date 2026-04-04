import type {
  ElementRef,
  OnInit} from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  forwardRef,
  inject,
  Injector,
  input,
  output,
  signal,
  ViewChild,
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
import { COUNTRIES, type Country } from '@core/mocks/countries.mock';
import { ValidationErrorMessagesService } from '@shared/services/validation-error-messages.service.ts/validation-error-messages.service.ts.component';
import { generateId, mergeClasses } from '@shared/utils/merge-classes';
import { LucideAngularModule } from 'lucide-angular';
import { NgxMaskDirective } from 'ngx-mask';

type InputStatus = 'base' | 'error';

const SORTED_COUNTRIES = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);

function detectCountry(digits: string): Country | null {
  return SORTED_COUNTRIES.find(c => digits.startsWith(c.dialCode)) ?? null;
}

@Component({
  selector: 'm-phone-input',
  templateUrl: './phone-input.component.html',
  styleUrl: './phone-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NgxMaskDirective, LucideAngularModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true,
    },
  ],
  host: {
    '[attr.data-status]': 'inputStatus()',
    '[attr.data-disabled]': 'disabledState() || null',
  },
})
export class PhoneInputComponent implements ControlValueAccessor, OnInit {
  @ViewChild('inputRef') private inputRef!: ElementRef<HTMLInputElement>;

  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  readonly validationErrorMessage = inject(ValidationErrorMessagesService);

  readonly id = input(generateId('phone'));
  readonly label = input('');
  readonly hint = input('');
  readonly disabled = input(false);
  readonly readonly = input(false);

  readonly changed = output<string>();

  readonly inputStatus = signal<InputStatus>('base');
  readonly value = signal('');
  readonly disabledState = signal(false);
  readonly dropdownOpen = signal(false);
  readonly selectedCountry = signal<Country>(COUNTRIES[0]);

  readonly currentMask = computed(() => this.selectedCountry().mask);
  readonly currentPlaceholder = computed(() => this.selectedCountry().placeholder);

  protected readonly wrapClasses = computed(() =>
    mergeClasses('phone-wrap', this.inputStatus() === 'error' && 'phone-wrap-error')
  );

  protected readonly countries = COUNTRIES;
  public control: FormControl | null = null;

  private onChange: (value: string) => void = () => {};
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

  protected selectCountry(country: Country): void {
    this.selectedCountry.set(country);
    this.value.set('+' + country.dialCode);
    this.onChange('+' + country.dialCode);
    this.dropdownOpen.set(false);
    setTimeout(() => this.inputRef?.nativeElement.focus());
  }

  protected onInputChange(event: Event): void {
    if (this.disabled() || this.disabledState()) return;

    const raw = (event.target as HTMLInputElement).value;
    const digits = raw.replace(/\D/g, '');

    const detected = detectCountry(digits);
    if (detected && detected.code !== this.selectedCountry().code) {
      this.selectedCountry.set(detected);
    }

    this.value.set(raw);
    this.onChange(raw);
    this.changed.emit(raw);
  }

  protected onBlur(): void {
    this.onTouched();
    this.inputStatus.set(this.control?.invalid ? 'error' : 'base');
  }

  protected toggleDropdown(): void {
    if (this.disabled() || this.disabledState() || this.readonly()) return;
    this.dropdownOpen.update(v => !v);
  }

  protected onFocusOut(event: FocusEvent): void {
    const related = event.relatedTarget as HTMLElement | null;
    if (!related?.closest('.phone-wrap')) {
      this.dropdownOpen.set(false);
    }
  }
}
