import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { generateId } from '@shared/utils/merge-classes';
import { LucideAngularModule } from 'lucide-angular';

import type { AccordionComponent } from '../accordion.component';

@Component({
  selector: 'm-accordion-item',
  templateUrl: './accordion-item.component.html',
  styleUrl: './accordion-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  host: {
    '[attr.data-state]': "isOpen() ? 'open' : 'closed'",
  },
  exportAs: 'mAccordionItem',
})
export class AccordionItemComponent {
  readonly title = input<string>('');
  readonly value = input<string>('');
  readonly disabled = input(false);

  readonly isOpen = signal(false);

  protected readonly headerId = generateId('accordion-header');
  protected readonly contentId = computed(() => this.headerId.replace('header', 'content'));

  accordion?: AccordionComponent;

  toggle(): void {
    if (this.disabled()) return;

    if (this.accordion) {
      this.accordion.toggleItem(this);
      return;
    }
    this.isOpen.update(v => !v);
  }
}
