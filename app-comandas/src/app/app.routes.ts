import { Routes } from '@angular/router';

// Definición de las rutas principales de nuestra aplicación de Comandas
export const routes: Routes = [
  {
    path: 'inicio',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full',
  },
];
