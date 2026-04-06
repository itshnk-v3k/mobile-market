import { BasePortalOutlet, CdkPortalOutlet, PortalModule } from '@angular/cdk/portal';
import type { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  ViewChild,
  type ComponentRef,
  type EmbeddedViewRef,
} from '@angular/core';
import type { SheetOptions } from './sheet.service';

@Component({
  selector: 'm-sheet',
  template: `
    <ng-template cdkPortalOutlet />
  `,
  styleUrl: './sheet.component.scss',
  imports: [PortalModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-state]': 'state()',
    '[attr.data-side]': 'config.side',
  },
})
export class SheetComponent extends BasePortalOutlet implements AfterViewInit {
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly config = inject<SheetOptions>(Object as any);

  @ViewChild(CdkPortalOutlet, { static: true })
  private readonly portalOutlet!: CdkPortalOutlet;

  readonly state = signal<'open' | 'closed'>('closed');

  ngAfterViewInit(): void {}

  getNativeElement(): HTMLElement {
    return this.host.nativeElement;
  }

  attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T> {
    return this.portalOutlet.attachComponentPortal(portal);
  }

  attachTemplatePortal<C>(portal: TemplatePortal<C>): EmbeddedViewRef<C> {
    return this.portalOutlet.attachTemplatePortal(portal);
  }
}
