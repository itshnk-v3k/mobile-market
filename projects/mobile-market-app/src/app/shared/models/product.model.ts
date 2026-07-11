import type { BadgeVariant } from '@shared/components/badge/badge.component';

export type ProductCategory = 'smartphones' | 'laptops' | 'tablets' | 'headphones' | 'accessories';

export interface ProductTag {
  label: string;
}

export interface ProductSpec {
  key: string;
  label: string;
  value: string;
  group?: string;
}

export interface ProductBadge {
  variant: BadgeVariant;
  label: string;
  icon?: string;
}

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: ProductCategory;
  image?: string;
  price: number;
  oldPrice?: number;
  cashback?: number;
  credit?: string;
  badges?: ProductBadge[];
  tags?: ProductTag[];
  specs?: ProductSpec[];
  inStock: boolean;
}

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  smartphones: 'Телефоны',
  laptops: 'Ноутбуки',
  tablets: 'Планшеты',
  headphones: 'Наушники',
  accessories: 'Аксессуары',
};
