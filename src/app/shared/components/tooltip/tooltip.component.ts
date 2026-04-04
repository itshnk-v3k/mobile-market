import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, type TemplateRef } from '@angular/core';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type TooltipSize = 'sm' | 'md' | 'lg';
export type TooltipState = 'closed' | 'opened';

@Component({
  selector: 'm-tooltip',
  templateUrl: './tooltip.component.html',
  styleUrl: './tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: {
    '[attr.data-position]': 'position()',
    '[attr.data-size]': 'size()',
    '[attr.data-state]': 'state()',
  },
})
export class TooltipComponent {
  readonly state = signal<TooltipState>('closed');
  readonly title = signal('');
  readonly content = signal('');
  readonly size = signal<TooltipSize>('sm');
  readonly isArrow = signal(true);
  readonly position = signal<TooltipPosition>('top');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly contentTemplate = signal<TemplateRef<any> | null>(null);

  setTitle(v: string): void {
    this.title.set(v.trim());
  }

  setContent(v: string): void {
    this.content.set(v.trim());
  }

  setSize(v: TooltipSize): void {
    this.size.set(v);
  }

  setArrow(v: boolean): void {
    this.isArrow.set(v);
  }

  setPosition(v: TooltipPosition): void {
    this.position.set(v);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setContentTemplate(v: TemplateRef<any> | null): void {
    this.contentTemplate.set(v);
  }
}
