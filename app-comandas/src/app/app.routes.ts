import { Routes } from '@angular/router';

// Definición de las rutas principales de nuestra aplicación de Comandas
export const routes: Routes = [
  {
    path: 'check-in',
    loadComponent: () => import('./features/autenticacion/check-in.component').then((m) => m.CheckInComponent),
  },
  {
    path: '',
    redirectTo: 'check-in',
    pathMatch: 'full',
  },
];
