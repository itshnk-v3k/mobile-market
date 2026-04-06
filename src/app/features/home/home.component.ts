import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BadgeComponent, BadgeVariant } from '@shared/components/badge/badge.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { CheckboxComponent } from '@shared/components/checkbox/checkbox.component';
import { InputComponent } from '@shared/components/input/input.component';
import { LoaderComponent } from '@shared/components/loader/loader.component';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';
import { RadioGroupComponent } from '@shared/components/radio-group/radio-group.component';
import { SelectComponent } from '@shared/components/select/select.component';
import { SwitchComponent } from '@shared/components/switch/switch.component';
import { TagComponent } from '@shared/components/tag/tag.component';
import { TextareaComponent } from '@shared/components/textarea/textarea.component';
import { TooltipDirective } from '@shared/components/tooltip/tooltip.directive';
import { LucideAngularModule } from 'lucide-angular';
import {
  CardProductComponent,
  ProductCardData,
} from '@features/components/card-product/card-product.component';

@Component({
  selector: 'm-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    InputComponent,
    ReactiveFormsModule,
    PhoneInputComponent,
    CheckboxComponent,
    SelectComponent,
    BadgeComponent,
    TagComponent,
    LoaderComponent,
    RadioGroupComponent,
    SwitchComponent,
    TextareaComponent,
    TooltipDirective,
    LucideAngularModule,
    CardProductComponent,
  ],
})
export class HomeComponent {
  readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    phone: new FormControl('', [Validators.required]),
    remember: new FormControl(false),
    agree: new FormControl(false, [Validators.requiredTrue]),
    brand: new FormControl(null),
    storage: new FormControl(null),
    color: new FormControl(null),
    inStock: new FormControl(false),
    notifications: new FormControl(false),
    message: new FormControl('', [Validators.required, Validators.minLength(10)]),
  });

  readonly colors = [
    { label: 'Чёрный', value: 'black' },
    { label: 'Белый', value: 'white' },
    { label: 'Синий', value: 'blue' },
  ];

  readonly product: ProductCardData = {
    id: '1',
    slug: 'apple-iphone-15-pro-256gb',
    name: 'Apple iPhone 15 Pro 256GB Titanium',
    brand: 'Apple',
    price: 89990,
    oldPrice: 99990,
    cashback: 900,
    credit: 'Credit 0|0|4',
    badge: 'sale',
    tags: [
      { label: '6.1"' },
      { label: '48 MP' },
      { label: '8 ГБ RAM' },
      { label: '5G' },
      { label: 'NFC' },
    ],
    rating: 4.8,
    reviewCount: 124,
    inStock: true,
    category: 'smartphones',
  };

  readonly products: ProductCardData[] = [
    this.product,
    {
      id: '2',
      slug: 'samsung-s24-ultra-256gb',
      name: 'Samsung Galaxy S24 Ultra 256GB',
      brand: 'Samsung',
      price: 79990,
      badge: 'hot',
      tags: [{ label: '6.8"' }, { label: '200 MP' }, { label: '12 ГБ RAM' }],
      inStock: true,
      category: 'smartphones',
    },
    {
      id: '3',
      slug: 'xiaomi-14-pro-512gb',
      name: 'Xiaomi 14 Pro 512GB',
      brand: 'Xiaomi',
      price: 59990,
      oldPrice: 69990,
      badge: 'new',
      tags: [{ label: '6.73"' }, { label: '50 MP' }, { label: '16 ГБ RAM' }],
      inStock: true,
      category: 'smartphones',
    },
    {
      id: '4',
      slug: 'google-pixel-8-pro',
      name: 'Google Pixel 8 Pro 128GB',
      brand: 'Google',
      price: 69990,
      tags: [{ label: '6.7"' }, { label: '50 MP' }, { label: '12 ГБ RAM' }],
      inStock: false,
      category: 'smartphones',
    },
  ];

  readonly loading = false;

  readonly wishlist = signal(new Set<string>());
  readonly compare = signal(new Set<string>());

  onToggleFavorite(product: ProductCardData): void {
    const set = new Set(this.wishlist());
    if (set.has(product.id)) {
      set.delete(product.id);
    } else {
      set.add(product.id);
    }
    this.wishlist.set(set);
  }

  onToggleCompare(product: ProductCardData): void {
    const set = new Set(this.compare());
    if (set.has(product.id)) {
      set.delete(product.id);
    } else {
      set.add(product.id);
    }
    this.compare.set(set);
  }

  onAddToCart(product: ProductCardData): void {
    console.log('Add to cart:', product.name);
  }
}
