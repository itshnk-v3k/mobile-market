import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { SheetRef } from '@shared/components/sheet/sheet-ref';
import { ButtonComponent } from '@shared/components/button/button.component';

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
