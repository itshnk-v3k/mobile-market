import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CardProductComponent } from '@features/components/card-product/card-product.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import {
  PRODUCT_CATEGORY_LABELS,
  type ProductCardData,
  type ProductCategory,
} from '@shared/models/product.model';
import { FavoritesService } from '@shared/services/favorites/favorites.service';
import { LucideAngularModule } from 'lucide-angular';

import { FavoritesEmptyComponent } from './favorites-empty/favorites-empty.component';

type CategoryFilter = ProductCategory | 'all';

@Component({
  selector: 'm-favorites',
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardProductComponent, FavoritesEmptyComponent, ButtonComponent, LucideAngularModule],
  host: {
    class: 'flex flex-1 flex-col',
  },
})
export class FavoritesComponent {
  private readonly favoritesService = inject(FavoritesService);

  protected readonly filter = signal<CategoryFilter>('all');

  protected readonly favorites = this.favoritesService.favorites;
  protected readonly count = this.favoritesService.count;
  protected readonly hasFavorites = computed(() => this.count() > 0);

  protected readonly availableCategories = computed<ProductCategory[]>(() => {
    const unique = new Set(this.favorites().map(p => p.category));
    return [...unique];
  });

  protected readonly filteredFavorites = computed<ProductCardData[]>(() => {
    const current = this.filter();
    if (current === 'all') return this.favorites();
    return this.favorites().filter(p => p.category === current);
  });

  protected readonly categoryLabel = PRODUCT_CATEGORY_LABELS;

  protected setFilter(value: CategoryFilter): void {
    this.filter.set(value);
  }

  protected clearAll(): void {
    this.favoritesService.clear();
    this.filter.set('all');
  }
}
