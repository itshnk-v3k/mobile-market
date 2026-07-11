import { BreakpointObserver } from '@angular/cdk/layout';
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CardProductComponent } from '@features/components/card-product/card-product.component';
import { AccordionComponent } from '@shared/components/accordion/accordion.component';
import { AccordionItemComponent } from '@shared/components/accordion/accordion-item/accordion-item.component';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { RadioComponent } from '@shared/components/radio/radio.component';
import { PRODUCT_CATEGORY_LABELS, type ProductCardData } from '@shared/models/product.model';
import { CompareService } from '@shared/services/compare/compare.service';
import { LucideAngularModule } from 'lucide-angular';
import { map } from 'rxjs';

import { CompareEmptyComponent } from './compare-empty/compare-empty.component';

type CompareMode = 'all' | 'common' | 'diff';

interface CompareRow {
  key: string;
  label: string;
  values: string[];
  hasDifference: boolean;
}

interface CompareGroup {
  name: string;
  rows: CompareRow[];
}

interface ModeOption {
  label: string;
  value: CompareMode;
}

const DEFAULT_GROUP = 'Характеристики';

@Component({
  selector: 'm-compare',
  templateUrl: './compare.component.html',
  styleUrl: './compare.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    LucideAngularModule,
    BadgeComponent,
    NgTemplateOutlet,
    ButtonComponent,
    CardProductComponent,
    CompareEmptyComponent,
    AccordionComponent,
    AccordionItemComponent,
    RadioComponent,
  ],
  host: {
    class: 'flex flex-1 flex-col',
  },
})
export class CompareComponent {
  private readonly compareService = inject(CompareService);
  private readonly breakpointObserver = inject(BreakpointObserver);

  protected readonly isDesktop = toSignal(
    this.breakpointObserver.observe('(min-width: 1024px)').pipe(map(s => s.matches)),
    { initialValue: false }
  );

  protected readonly mode = signal<CompareMode>('all');

  protected readonly items = this.compareService.items;
  protected readonly count = this.compareService.count;
  protected readonly maxItems = this.compareService.maxItems;

  protected readonly modeOptions: ModeOption[] = [
    { label: 'Все характеристики', value: 'all' },
    { label: 'Только сходства', value: 'common' },
    { label: 'Только различия', value: 'diff' },
  ];

  protected readonly categoryLabel = computed(() => {
    const category = this.compareService.activeCategory();
    return category ? PRODUCT_CATEGORY_LABELS[category] : null;
  });

  protected readonly allGroups = computed<CompareGroup[]>(() => {
    const products = this.items();
    if (!products.length) return [];

    const order: string[] = [];
    const keysByGroup = new Map<string, string[]>();
    const labelsByGroup = new Map<string, Map<string, string>>();

    for (const product of products) {
      for (const spec of product.specs ?? []) {
        const group = spec.group ?? DEFAULT_GROUP;

        if (!keysByGroup.has(group)) {
          order.push(group);
          keysByGroup.set(group, []);
          labelsByGroup.set(group, new Map());
        }

        const keys = keysByGroup.get(group)!;
        const labels = labelsByGroup.get(group)!;

        if (!labels.has(spec.key)) {
          keys.push(spec.key);
          labels.set(spec.key, spec.label);
        }
      }
    }

    return order.map(group => {
      const keys = keysByGroup.get(group)!;
      const labels = labelsByGroup.get(group)!;

      const rows = keys.map<CompareRow>(key => {
        const values = products.map(p => {
          const spec = p.specs?.find(s => s.key === key && (s.group ?? DEFAULT_GROUP) === group);
          return spec?.value ?? '—';
        });

        return {
          key,
          label: labels.get(key)!,
          values,
          hasDifference: new Set(values).size > 1,
        };
      });

      return { name: group, rows };
    });
  });

  protected readonly filteredGroups = computed<CompareGroup[]>(() => {
    const m = this.mode();
    if (m === 'all') return this.allGroups();

    return this.allGroups()
      .map(group => ({
        ...group,
        rows: group.rows.filter(r => (m === 'diff' ? r.hasDifference : !r.hasDifference)),
      }))
      .filter(group => group.rows.length > 0);
  });

  protected readonly defaultGroupValues = computed(() => this.allGroups().map(g => g.name));

  protected setMode(mode: unknown): void {
    this.mode.set(mode as CompareMode);
  }

  protected clearAll(): void {
    this.compareService.clear();
    this.mode.set('all');
  }

  protected trackProduct(_: number, product: ProductCardData): string {
    return product.id;
  }

  protected trackGroup(_: number, group: CompareGroup): string {
    return group.name;
  }

  protected trackRow(_: number, row: CompareRow): string {
    return row.key;
  }
}
