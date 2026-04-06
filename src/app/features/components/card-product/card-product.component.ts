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
import { DecimalPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { BadgeComponent, type BadgeVariant } from '@shared/components/badge/badge.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { TagComponent } from '@shared/components/tag/tag.component';
import { ToastService } from '@shared/services/toast/toast.service';
import { CardProductSkeletonComponent } from './card-product-skeleton/card-product-skeleton.component';

export interface ProductTag {
  label: string;
}

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image?: string;
  price: number;
  oldPrice?: number;
  cashback?: number;
  credit?: string;
  badge?: BadgeVariant;
  tags?: ProductTag[];
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
  category: string;
}

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
    '[attr.data-loading]': 'loading() || null',
    '[attr.data-adaptive]': 'adaptive() || null',
  },
})
export class CardProductComponent {
  private readonly toast = inject(ToastService);

  readonly product = input<ProductCardData | null>(null);
  readonly loading = input(false);
  readonly adaptive = input(true);
  readonly isFavorite = input(false);
  readonly isCompared = input(false);

  readonly addToCart = output<ProductCardData>();
  readonly toggleFavorite = output<ProductCardData>();
  readonly toggleCompare = output<ProductCardData>();

  protected readonly imageError = signal(false);

  protected readonly discount = computed(() => {
    const p = this.product();
    if (!p?.oldPrice || p.oldPrice <= p.price) return null;
    return Math.round((1 - p.price / p.oldPrice) * 100);
  });

  protected onAddToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const p = this.product();

    if (!p) return;

    this.addToCart.emit(p);
    this.toast.success(`«${p.name}» добавлен в корзину`);
  }

  protected onToggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const p = this.product();
    if (p) this.toggleFavorite.emit(p);
  }

  protected onToggleCompare(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const p = this.product();
    if (p) this.toggleCompare.emit(p);
  }

  protected onImageError(): void {
    this.imageError.set(true);
  }
}
