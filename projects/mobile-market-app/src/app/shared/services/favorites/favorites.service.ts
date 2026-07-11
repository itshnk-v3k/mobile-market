import { computed, Injectable, signal } from '@angular/core';
import type { ProductCardData } from '@shared/models/product.model';

interface StoredFavorite {
  product: ProductCardData;
  expiresAt: number;
}

type FavoritesMap = Record<string, StoredFavorite>;

const STORAGE_KEY = 'mm:favorites';
const TTL_MS = 24 * 60 * 60 * 1000;
const CHANNEL_NAME = 'mm:favorites';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly state = signal<FavoritesMap>(this.read());
  private readonly channel = this.createChannel();

  readonly favorites = computed(() => Object.values(this.state()).map(i => i.product));
  readonly count = computed(() => this.favorites().length);
  readonly ids = computed(() => new Set(this.favorites().map(p => p.id)));

  isFavorite(productId: string): boolean {
    return this.ids().has(productId);
  }

  toggle(product: ProductCardData): boolean {
    const current = this.state();
    const wasIn = !!current[product.id];
    const next = { ...current };

    if (wasIn) {
      delete next[product.id];
    } else {
      next[product.id] = { product, expiresAt: Date.now() + TTL_MS };
    }

    this.commit(next);
    return !wasIn;
  }

  remove(productId: string): void {
    const next = { ...this.state() };
    delete next[productId];
    this.commit(next);
  }

  clear(): void {
    this.commit({});
  }

  snapshot(): ProductCardData[] {
    return this.favorites();
  }

  private commit(next: FavoritesMap): void {
    this.state.set(next);
    this.persist(next);
    this.channel?.postMessage({ type: 'sync' });
  }

  private persist(data: FavoritesMap): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* storage disabled or full */
    }
  }

  private read(): FavoritesMap {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};

      const parsed = JSON.parse(raw) as FavoritesMap;
      const now = Date.now();
      const cleaned: FavoritesMap = {};

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
