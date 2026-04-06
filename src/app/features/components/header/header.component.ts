import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { SheetService } from '@shared/components/sheet/sheet.service';
import { CartSheetComponent } from './cart-sheet/cart-sheet.component';

interface NavItem {
  label: string;
  route: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Каталог', route: '/catalog' },
  { label: 'Новинки', route: '/new' },
  { label: 'Акции', route: '/sale' },
  { label: 'О нас', route: '/about' },
];

@Component({
  selector: 'm-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  host: {
    '[attr.data-scrolled]': 'scrolled() || null',
  },
})
export class HeaderComponent {
  private readonly sheetService = inject(SheetService);
  private readonly destroyRef = inject(DestroyRef);

  readonly navItems = NAV_ITEMS;
  readonly scrolled = signal(false);
  readonly mobileMenuOpen = signal(false);
  readonly cartCount = signal(0);
  readonly wishlistCount = signal(0);

  constructor() {
    afterNextRender(() => {
      const handler = () => this.scrolled.set(window.scrollY > 10);
      window.addEventListener('scroll', handler, { passive: true });
      this.destroyRef.onDestroy(() => window.removeEventListener('scroll', handler));
    });
  }

  openCart(): void {
    this.sheetService.open({ component: CartSheetComponent, side: 'right' });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
