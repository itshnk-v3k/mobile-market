import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { BadgeComponent } from '@shared/components/badge/badge.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { TagComponent } from '@shared/components/tag/tag.component';
import { PRODUCT_CATEGORY_LABELS, type ProductCardData } from '@shared/models/product.model';
import { CompareService } from '@shared/services/compare/compare.service';
import { FavoritesService } from '@shared/services/favorites/favorites.service';
import { ToastService } from '@shared/services/toast/toast.service';
import { LucideAngularModule } from 'lucide-angular';

import { CardProductSkeletonComponent } from './card-product-skeleton/card-product-skeleton.component';

@Component({
  selector: 'm-card-product',
  templateUrl: './card-product.component.html',
  styleUrl: './card-product.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DecimalPipe,
    LucideAngularModule,
    BadgeComponent,
    ButtonComponent,
    TagComponent,
    CardProductSkeletonComponent,
  ],
  host: {
    '[attr.data-adaptive]': 'adaptive() || null',
    '[attr.data-loading]': 'loading() || null',
    '[attr.data-favorite]': 'isFavorite() || null',
    '[attr.data-compare]': 'isInCompare() || null',
  },
})
export class CardProductComponent {
  private readonly favoritesService = inject(FavoritesService);
  private readonly compareService = inject(CompareService);
  private readonly toast = inject(ToastService);

  readonly product = input.required<ProductCardData>();
  readonly loading = input(false);
  readonly adaptive = input(true);

  readonly addToCart = output<ProductCardData>();
  readonly favoriteChange = output<{ product: ProductCardData; added: boolean }>();
  readonly compareChange = output<{ product: ProductCardData; added: boolean }>();

  protected readonly imageError = signal(false);

  protected readonly isFavorite = computed(() =>
    this.favoritesService.isFavorite(this.product().id)
  );

  protected readonly isInCompare = computed(() =>
    this.compareService.isInCompare(this.product().id)
  );

  protected readonly discount = computed(() => {
    const p = this.product();
    if (!p.oldPrice || p.oldPrice <= p.price) return null;
    return Math.round((1 - p.price / p.oldPrice) * 100);
  });

  protected readonly savings = computed(() => {
    const p = this.product();
    if (!p.oldPrice || p.oldPrice <= p.price) return null;
    return p.oldPrice - p.price;
  });

  protected onAddToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const p = this.product();
    this.addToCart.emit(p);
    this.toast.success(`«${p.name}» добавлен в корзину`);
  }

  protected onToggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const p = this.product();
    const added = this.favoritesService.toggle(p);

    this.toast.info(added ? 'Добавлено в избранное' : 'Удалено из избранного');
    this.favoriteChange.emit({ product: p, added });
  }

  protected onToggleCompare(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const p = this.product();
    const result = this.compareService.toggle(p);

    switch (result.status) {
      case 'added':
        this.toast.info('Добавлено к сравнению');
        this.compareChange.emit({ product: p, added: true });
        break;
      case 'removed':
        this.toast.info('Удалено из сравнения');
        this.compareChange.emit({ product: p, added: false });
        break;
      case 'category-mismatch': {
        const label = PRODUCT_CATEGORY_LABELS[result.activeCategory];
        this.toast.error(`Можно сравнивать только товары одной категории (${label})`);
        break;
      }
      case 'limit-reached':
        this.toast.error(`Можно сравнивать не более ${result.limit} товаров`);
        break;
    }
  }

  protected onImageError(): void {
    this.imageError.set(true);
  }
}
