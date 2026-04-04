import { afterNextRender, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastService } from '@shared/services/toast/toast.service';
import { NgxSonnerToaster } from 'ngx-sonner';

@Component({
  selector: 'm-root',
  imports: [RouterOutlet, NgxSonnerToaster],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class App {
  private readonly toast = inject(ToastService);

  constructor() {
    afterNextRender(() => {
      this.toast.success('Товар добавлен в корзину');
      this.toast.success('Товар добавлен в корзину');
      this.toast.success('Товар добавлен в корзину');
      this.toast.success('Товар добавлен в корзину');
    });
  }
}
