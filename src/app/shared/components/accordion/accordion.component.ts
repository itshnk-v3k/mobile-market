import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  input,
} from '@angular/core';

import { AccordionItemComponent } from './accordion-item/accordion-item.component';

@Component({
  selector: 'm-accordion',
  template: '<ng-content />',
  styleUrl: './accordion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'mAccordion',
})
export class AccordionComponent {
  readonly items = contentChildren(AccordionItemComponent);

  readonly type = input<'single' | 'multiple'>('single');
  readonly collapsible = input(true);
  readonly defaultValue = input<string | string[]>('');

  private readonly initialValues = computed<string[]>(() => {
    const value = this.defaultValue();
    if (typeof value === 'string') return value ? [value] : [];
    if (this.type() === 'single' && value.length > 1) {
      throw new Error('Array of default values is supported only for multiple type');
    }
    return value;
  });

  constructor() {
    effect(() => {
      const items = this.items();
      const initial = this.initialValues();

      for (const item of items) {
        if (item.accordion !== this) {
          item.accordion = this;
          item.isOpen.set(initial.includes(item.value()));
        }
      }
    });
  }

  toggleItem(selected: AccordionItemComponent): void {
    if (this.type() === 'single') {
      this.toggleSingle(selected);
      return;
    }
    this.toggleMultiple(selected);
  }

  private toggleSingle(selected: AccordionItemComponent): void {
    const isClosing = selected.isOpen();
    if (isClosing && !this.collapsible()) return;

    for (const item of this.items()) {
      item.isOpen.set(item === selected ? !item.isOpen() : false);
    }
  }

  private toggleMultiple(selected: AccordionItemComponent): void {
    const isClosing = selected.isOpen();
    if (isClosing && !this.collapsible() && this.openCount() <= 1) return;

    selected.isOpen.update(v => !v);
  }

  private openCount(): number {
    return this.items().reduce((acc, item) => (item.isOpen() ? acc + 1 : acc), 0);
  }
}
