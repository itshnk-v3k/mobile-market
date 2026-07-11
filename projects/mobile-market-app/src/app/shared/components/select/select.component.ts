import type {
  OnDestroy,
  TemplateRef} from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import type { ControlValueAccessor} from '@angular/forms';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { LucideDynamicIcon } from '@lucide/angular';
import { generateId } from '@shared/utils/merge-classes';

import { SelectDropdownService } from './select-dropdown.service';

export interface SelectOption {
  label: string;
  value: unknown;
  disabled?: boolean;
}

export type SelectSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'm-select',
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideDynamicIcon],
  providers: [
    SelectDropdownService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  host: {
    '[attr.data-size]': 'size()',
    '[attr.data-disabled]': 'disabledState() || null',
    '[attr.data-open]': 'dropdown.isOpen()',
  },
})
export class SelectComponent implements ControlValueAccessor, OnDestroy {
  protected readonly dropdown = inject(SelectDropdownService);
  private readonly elementRef = inject(ElementRef);
  private readonly vcr = inject(ViewContainerRef);

  readonly id = input(generateId('select'));
  readonly size = input<SelectSize>('md');
  readonly label = input('');
  readonly placeholder = input('Выберите...');
  readonly hint = input('');
  readonly options = input<SelectOption[]>([]);

  protected readonly dropdownTemplate = viewChild.required<TemplateRef<unknown>>('dropdownTpl');
  protected readonly triggerRef = viewChild.required<ElementRef>('trigger');

  protected readonly selectedValue = signal<unknown>(null);
  protected readonly disabledState = signal(false);

  protected readonly selectedLabel = computed(() => {
    const opt = this.options().find(o => o.value === this.selectedValue());
    return opt?.label ?? '';
  });

  private onChange: (v: unknown) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: unknown): void {
    this.selectedValue.set(val ?? null);
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

  protected toggle(): void {
    if (this.disabledState()) return;
    const width = (this.elementRef.nativeElement as HTMLElement).offsetWidth;
    this.dropdown.toggle(this.triggerRef(), this.dropdownTemplate(), this.vcr, width);
  }

  protected select(option: SelectOption): void {
    if (option.disabled) return;
    this.selectedValue.set(option.value);
    this.onChange(option.value);
    this.onTouched();
    this.dropdown.close();
  }

  protected isSelected(option: SelectOption): boolean {
    return this.selectedValue() === option.value;
  }

  ngOnDestroy(): void {
    this.dropdown.close();
  }
}
