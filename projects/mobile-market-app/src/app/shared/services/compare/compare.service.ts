import { computed, Injectable, signal } from '@angular/core';
import type { ProductCardData, ProductCategory } from '@shared/models/product.model';

type CompareMap = Record<string, { product: ProductCardData; expiresAt: number }>;

export type CompareToggleResult =
  | { status: 'added' }
  | { status: 'removed' }
  | { status: 'category-mismatch'; activeCategory: ProductCategory }
  | { status: 'limit-reached'; limit: number };

const STORAGE_KEY = 'mm:compare';
const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ITEMS = 4;
const CHANNEL_NAME = 'mm:compare';

@Injectable({ providedIn: 'root' })
export class CompareService {
  readonly maxItems = MAX_ITEMS;

  private readonly state = signal<CompareMap>(this.read());
  private readonly channel = this.createChannel();

  readonly items = computed(() => Object.values(this.state()).map(i => i.product));
  readonly count = computed(() => this.items().length);
  readonly ids = computed(() => new Set(this.items().map(p => p.id)));
  readonly activeCategory = computed<ProductCategory | null>(
    () => this.items()[0]?.category ?? null
  );
  readonly isFull = computed(() => this.count() >= MAX_ITEMS);

  isInCompare(productId: string): boolean {
    return this.ids().has(productId);
  }

  toggle(product: ProductCardData): CompareToggleResult {
    const current = this.state();

    if (current[product.id]) {
      const next = { ...current };
      delete next[product.id];
      this.commit(next);
      return { status: 'removed' };
    }

    const active = this.activeCategory();
    if (active && active !== product.category) {
      return { status: 'category-mismatch', activeCategory: active };
    }

    if (this.count() >= MAX_ITEMS) {
      return { status: 'limit-reached', limit: MAX_ITEMS };
    }

    this.commit({
      ...current,
      [product.id]: { product, expiresAt: Date.now() + TTL_MS },
    });
    return { status: 'added' };
  }

  remove(productId: string): void {
    const next = { ...this.state() };
    delete next[productId];
    this.commit(next);
  }

  clear(): void {
    this.commit({});
  }

  private commit(next: CompareMap): void {
    this.state.set(next);
    this.persist(next);
    this.channel?.postMessage({ type: 'sync' });
  }

  private persist(data: CompareMap): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* noop */
    }
  }

  private read(): CompareMap {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};

      const parsed = JSON.parse(raw) as CompareMap;
      const now = Date.now();
      const cleaned: CompareMap = {};

      for (const [id, item] of Object.entries(parsed)) {
        if (item?.expiresAt > now) cleaned[id] = item;
      }

      if (Object.keys(cleaned).length !== Object.keys(parsed).length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      }

      return cleaned;
    } catch {
      return {};
    }
  }

  private createChannel(): BroadcastChannel | null {
    if (typeof BroadcastChannel === 'undefined') return null;

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = () => this.state.set(this.read());
    return channel;
  }
}
