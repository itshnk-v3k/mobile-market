import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { inject, Injectable, InjectionToken, Injector, type Type } from '@angular/core';
import { SheetRef } from './sheet-ref';
import { SheetComponent } from './sheet.component';

export const SHEET_DATA = new InjectionToken<unknown>('SHEET_DATA');

export interface SheetOptions<T = unknown> {
  component: Type<T>;
  side?: 'left' | 'right' | 'bottom';
  data?: unknown;
}

@Injectable({ providedIn: 'root' })
export class SheetService {
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);

  open<T>(options: SheetOptions<T>): SheetRef {
    const config = new OverlayConfig({
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
      positionStrategy: this.overlay.position().global(),
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    const overlayRef = this.overlay.create(config);
    document.body.style.overflow = 'hidden';

    const sheetInjector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: Object, useValue: { side: options.side ?? 'right' } },
        { provide: SHEET_DATA, useValue: options.data },
      ],
    });

    const containerPortal = new ComponentPortal(SheetComponent, null, sheetInjector);
    const containerRef = overlayRef.attach(containerPortal);
    containerRef.changeDetectorRef.detectChanges();

    const sheetRef = new SheetRef(overlayRef, containerRef.instance);
    containerRef.instance.state.set('open');

    const contentInjector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: SheetRef, useValue: sheetRef },
        { provide: SHEET_DATA, useValue: options.data },
      ],
    });

    const contentPortal = new ComponentPortal(options.component, null, contentInjector);
    containerRef.instance.attachComponentPortal(contentPortal);

    return sheetRef;
  }
}
