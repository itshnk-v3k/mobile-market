import type { Routes } from '@angular/router';

import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('@features/home/home.component').then(m => m.HomeComponent),
      },
    ],
  },
  {
    path: 'favorites',
    loadComponent: () =>
      import('@features/favorites/favorites.component').then(m => m.FavoritesComponent),
  },
  {
    path: 'compare',
    loadComponent: () =>
      import('@features/compare/compare.component').then(m => m.CompareComponent),
  },
  { path: '**', redirectTo: '' },
];
