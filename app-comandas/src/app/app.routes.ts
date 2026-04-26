import { Routes } from '@angular/router';

// Definición de las rutas principales de nuestra aplicación de Comandas
export const routes: Routes = [
  {
    path: 'check-in',
    loadComponent: () => import('./features/autenticacion/check-in.component').then((m) => m.CheckInComponent),
  },
  {
    path: 'carta',
    loadComponent: () => import('./features/carta/carta.component').then((m) => m.CartaComponent),
  },
  {
    path: 'resumen-comanda',
    loadComponent: () => import('./features/comandas/resumen-comanda/resumen-comanda.component').then((m) => m.ResumenComandaComponent),
  },
  {
    path: '',
    redirectTo: 'check-in',
    pathMatch: 'full',
  },
];
