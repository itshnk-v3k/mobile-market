import { Component, input } from '@angular/core';

@Component({
  selector: 'm-btn-loader',
  template: `
    <svg
      class="animate-spin"
      [attr.width]="size()"
      [attr.height]="size()"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      role="status"
      aria-label="Loading">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  `,
  styles: [
    `
      :host {
        @apply absolute left-1/2 -translate-x-1/2;
      }
    `,
  ],
})
export class BtnLoaderComponent {
  readonly size = input(18);
}
