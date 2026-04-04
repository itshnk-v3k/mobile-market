import {
  type ConnectedPosition,
  Overlay,
  OverlayPositionBuilder,
  type OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  type ComponentRef,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  Injector,
  input,
  numberAttribute,
  type OnDestroy,
  type OnInit,
  output,
  PLATFORM_ID,
  Renderer2,
  runInInjectionContext,
  type TemplateRef,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { generateId } from '@shared/utils/merge-classes';
import { filter, map, of, Subject, switchMap, tap, timer } from 'rxjs';

import { TooltipComponent, type TooltipPosition, type TooltipSize } from './tooltip.component';

const POSITIONS_MAP: Record<TooltipPosition, ConnectedPosition> = {
  top: { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -8 },
  bottom: { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 8 },
  left: { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -8 },
  right: { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 8 },
};

interface DelayConfig {
  isShow: boolean;
  delay: number;
}

@Directive({
  selector: '[mTooltip]',
})
export class TooltipDirective implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);
  private readonly overlay = inject(Overlay);
  private readonly positionBuilder = inject(OverlayPositionBuilder);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly renderer = inject(Renderer2);

  private overlayRef?: OverlayRef;
  private componentRef?: ComponentRef<TooltipComponent>;
  private delaySubject?: Subject<DelayConfig>;
  private listeners: (() => void)[] = [];
  private readonly tooltipId = generateId('m-tooltip');

  readonly mTooltip = input('');
  readonly tooltipTitle = input('');
  readonly tooltipSize = input<TooltipSize>('sm');
  readonly tooltipPosition = input<TooltipPosition>('top');
  readonly tooltipArrow = input(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly tooltipTemplate = input<TemplateRef<any> | null>(null);
  readonly tooltipTrigger = input<'hover' | 'click'>('hover');
  readonly showDelay = input(150, { transform: numberAttribute });
  readonly hideDelay = input(100, { transform: numberAttribute });

  readonly tooltipShow = output<void>();
  readonly tooltipHide = output<void>();

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    runInInjectionContext(this.injector, () => {
      toObservable(this.tooltipTrigger)
        .pipe(
          tap(() => {
            this.setupDelay();
            this.cleanupListeners();
            this.initTriggers();
          }),
          filter(() => !!this.overlayRef),
          switchMap(() => this.overlayRef!.outsidePointerEvents()),
          filter(e => !this.elementRef.nativeElement.contains(e.target as Node)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => this.delay(false, 0));
    });
  }

  ngOnDestroy(): void {
    this.delaySubject?.complete();
    this.cleanupListeners();
    this.overlayRef?.dispose();
  }

  private getPositions(): ConnectedPosition[] {
    const pos = this.tooltipPosition();
    const fallbacks: Record<TooltipPosition, TooltipPosition> = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left',
    };
    return [POSITIONS_MAP[pos], POSITIONS_MAP[fallbacks[pos]]];
  }

  private mapPosition(pair: ConnectedPosition): TooltipPosition {
    if (pair.originY === 'top' && pair.overlayY === 'bottom') return 'top';
    if (pair.originY === 'bottom' && pair.overlayY === 'top') return 'bottom';
    if (pair.originX === 'start' && pair.overlayX === 'end') return 'left';
    return 'right';
  }

  private initTriggers(): void {
    if (this.tooltipTrigger() === 'hover') {
      this.listeners.push(
        this.renderer.listen(this.elementRef.nativeElement, 'mouseenter', () =>
          this.delay(true, this.showDelay())
        ),
        this.renderer.listen(this.elementRef.nativeElement, 'mouseleave', () =>
          this.delay(false, this.hideDelay())
        ),
        this.renderer.listen(this.elementRef.nativeElement, 'focus', () =>
          this.delay(true, this.showDelay())
        ),
        this.renderer.listen(this.elementRef.nativeElement, 'blur', () =>
          this.delay(false, this.hideDelay())
        )
      );
    } else {
      this.listeners.push(
        this.renderer.listen(this.elementRef.nativeElement, 'click', () => {
          const show = !this.overlayRef?.hasAttached();
          this.delay(show, show ? this.showDelay() : this.hideDelay());
        })
      );
    }

    this.listeners.push(
      this.renderer.listen(this.document.defaultView, 'scroll', () => this.delay(false, 0))
    );
  }

  private cleanupListeners(): void {
    this.listeners.forEach(off => off());
    this.listeners = [];
  }

  private delay(isShow: boolean, delay = -1): void {
    this.delaySubject?.next({ isShow, delay });
  }

  private setupDelay(): void {
    this.delaySubject?.complete();
    this.delaySubject = new Subject<DelayConfig>();

    this.delaySubject
      .pipe(
        switchMap(cfg => (cfg.delay < 0 ? of(cfg) : timer(cfg.delay).pipe(map(() => cfg)))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(cfg => (cfg.isShow ? this.show() : this.hide()));
  }

  private createOverlay(): void {
    if (this.overlayRef) return;

    const positionStrategy = this.positionBuilder
      .flexibleConnectedTo(this.elementRef)
      .withPush(false)
      .withPositions(this.getPositions());

    this.overlayRef = this.overlay.create({ positionStrategy });

    positionStrategy.positionChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(change => {
      const pos = this.mapPosition(change.connectionPair);
      this.componentRef?.instance.setPosition(pos);
    });
  }

  private show(): void {
    if (this.componentRef || (!this.mTooltip() && !this.tooltipTitle() && !this.tooltipTemplate()))
      return;

    this.createOverlay();

    this.componentRef = this.overlayRef?.attach(new ComponentPortal(TooltipComponent));

    if (!this.componentRef) return;

    const instance = this.componentRef.instance;
    instance.setTitle(this.tooltipTitle());
    instance.setContent(this.mTooltip());
    instance.setArrow(this.tooltipArrow());
    instance.setPosition(this.tooltipPosition());
    instance.setSize(this.tooltipSize());
    instance.setContentTemplate(this.tooltipTemplate());
    instance.state.set('opened');

    this.renderer.setAttribute(this.elementRef.nativeElement, 'aria-describedby', this.tooltipId);
    this.tooltipShow.emit();
  }

  private hide(): void {
    if (!this.componentRef) return;
    this.renderer.removeAttribute(this.elementRef.nativeElement, 'aria-describedby');
    this.componentRef.instance.state.set('closed');
    this.overlayRef?.detach();
    this.componentRef = undefined;
    this.tooltipHide.emit();
  }
}
