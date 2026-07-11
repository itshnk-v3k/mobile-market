import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonComponent } from '@shared/components/button/button.component';
import { SheetRef } from '@shared/components/sheet/sheet-ref';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'm-cart-sheet',
  templateUrl: './cart-sheet.component.html',
  styleUrl: './cart-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, ButtonComponent],
})
export class CartSheetComponent {
  private readonly sheetRef = inject(SheetRef);

  close(): void {
    this.sheetRef.close();
  }
}
