import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MOCK_PRODUCTS } from '@core/mocks/products.mock';
import { CardProductComponent } from '@features/components/card-product/card-product.component';
import { BadgeComponent } from '@shared/components/badge/badge.component';
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
import type { ProductCardData } from '@shared/models/product.model';
import { LucideAngularModule } from 'lucide-angular';

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

  readonly products = MOCK_PRODUCTS;
  readonly product = MOCK_PRODUCTS[0];

  readonly loading = false;

  onAddToCart(product: ProductCardData): void {
    console.log('Add to cart:', product.name);
  }
}
