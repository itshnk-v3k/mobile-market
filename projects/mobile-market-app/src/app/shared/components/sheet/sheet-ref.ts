import type { OverlayRef } from '@angular/cdk/overlay';
import { filter, fromEvent, Subject, takeUntil } from 'rxjs';

import type { SheetComponent } from './sheet.component';

export class SheetRef<R = unknown> {
  private readonly destroy$ = new Subject<void>();
  private isClosing = false;

  constructor(
    private readonly overlayRef: OverlayRef,
    private readonly containerInstance: SheetComponent
  ) {
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        filter(e => e.key === 'Escape'),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.close());

    this.overlayRef
      .outsidePointerEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.close());
  }

  close(): void {
    if (this.isClosing) return;
    this.isClosing = true;

    this.containerInstance.state.set('closed');

    const el = this.containerInstance.getNativeElement();
    let done = false;

    const cleanup = () => {
      if (done) return;
      done = true;
      el.removeEventListener('animationend', cleanup);
      this.destroy$.next();
      this.destroy$.complete();
      document.body.style.overflow = '';
      this.overlayRef.dispose();
    };

    el.addEventListener('animationend', cleanup);
    setTimeout(cleanup, 350);
  }
}
