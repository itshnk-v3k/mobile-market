import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { ButtonComponent } from '@shared/components/button/button.component';
import { SheetRef } from '@shared/components/sheet/sheet-ref';

@Component({
  selector: 'm-cart-sheet',
  templateUrl: './cart-sheet.component.html',
  styleUrl: './cart-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideDynamicIcon, ButtonComponent],
})
export class CartSheetComponent {
  private readonly sheetRef = inject(SheetRef);

  close(): void {
    this.sheetRef.close();
  }
}
