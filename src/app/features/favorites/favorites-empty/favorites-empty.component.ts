import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@shared/components/button/button.component';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'm-favorites-empty',
  templateUrl: './favorites-empty.component.html',
  styleUrl: './favorites-empty.component.scss',
  imports: [ButtonComponent, RouterLink, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-1 items-center justify-center py-16',
  },
})
export class FavoritesEmptyComponent {}
