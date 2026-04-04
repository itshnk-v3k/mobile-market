import { Overlay, OverlayPositionBuilder, type OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  type ElementRef,
  inject,
  Injectable,
  signal,
  type TemplateRef,
  type ViewContainerRef,
} from '@angular/core';
import type { Subscription } from 'rxjs';

@Injectable()
export class SelectDropdownService {
  private readonly overlay = inject(Overlay);
  private readonly positionBuilder = inject(OverlayPositionBuilder);

  private overlayRef?: OverlayRef;
  private outsideSub?: Subscription;

  readonly isOpen = signal(false);

  toggle(
    trigger: ElementRef,
    template: TemplateRef<unknown>,
    vcr: ViewContainerRef,
    width: number
  ): void {
    this.isOpen() ? this.close() : this.open(trigger, template, vcr, width);
  }

  open(
    trigger: ElementRef,
    template: TemplateRef<unknown>,
    vcr: ViewContainerRef,
    width: number
  ): void {
    if (this.isOpen()) this.close();

    const positionStrategy = this.positionBuilder
      .flexibleConnectedTo(trigger)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
      ])
      .withPush(false);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: false,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      width,
      maxHeight: 300,
    });

    this.overlayRef.attach(new TemplatePortal(template, vcr));
    this.isOpen.set(true);

    this.outsideSub = this.overlayRef.outsidePointerEvents().subscribe(() => this.close());
  }

  close(): void {
    this.overlayRef?.detach();
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
    this.outsideSub?.unsubscribe();
    this.isOpen.set(false);
  }
}
