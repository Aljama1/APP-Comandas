import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

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
    path: 'seguimiento-comanda',
    loadComponent: () => import('./features/comandas/seguimiento-comanda/seguimiento-comanda.component').then((m) => m.SeguimientoComandaComponent),
  },

  // --- RUTAS B2B (Staff) ---
  {
    path: 'admin/login',
    loadComponent: () => import('./features/admin/login-admin/login-admin.component').then((m) => m.LoginAdminComponent),
  },
  // La ruta del panel protegida por el Guardián
  {
    path: 'admin/panel-pedidos',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/panel-pedidos/panel-pedidos.component').then((m) => m.PanelPedidosComponent),
  },
  {
    path: 'admin/cocina',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/vista-cocina/vista-cocina.component').then((m) => m.VistaCocinaComponent),
  },
  {
    // Vista exclusiva del Barman — misma lógica que cocina pero filtrando bebidas (BARRA)
    path: 'admin/barra',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/vista-barra/vista-barra.component').then((m) => m.VistaBarraComponent),
  },

  {
    path: '',
    loadComponent: () => import('./features/autenticacion/selector-rol/selector-rol.component').then((m) => m.SelectorRolComponent),
    pathMatch: 'full',
  },
];
