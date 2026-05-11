import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

// Definición de las rutas principales de nuestra aplicación de Comandas
export const routes: Routes = [
  {
    path: 'check-in',
    loadComponent: () => import('./features/autenticacion/check-in.component').then((m) => m.CheckInComponent),
  },
  {
    path: 'carta',
    canActivate: [authGuard],
    loadComponent: () => import('./features/carta/carta.component').then((m) => m.CartaComponent),
  },
  {
    path: 'resumen-comanda',
    canActivate: [authGuard],
    loadComponent: () => import('./features/comandas/resumen-comanda/resumen-comanda.component').then((m) => m.ResumenComandaComponent),
  },
  {
    path: 'seguimiento-comanda',
    canActivate: [authGuard],
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
    path: 'admin/productos',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/gestion-productos/lista-productos.component').then((m) => m.ListaProductosComponent),
  },
  {
    path: 'admin/productos/nuevo',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/gestion-productos/formulario-producto.component').then((m) => m.FormularioProductoComponent),
  },
  {
    path: 'admin/productos/:id/editar',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/gestion-productos/formulario-producto.component').then((m) => m.FormularioProductoComponent),
  },
  {
    path: 'admin/metricas',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/dashboard-metricas/dashboard-metricas.component').then((m) => m.DashboardMetricasComponent),
  },
  {
    path: 'admin/cuentas',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/gestion-cuentas/gestion-cuentas.component').then((m) => m.GestionCuentasComponent),
  },
  {
    path: 'admin/qr',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/generador-qr/generador-qr.component').then((m) => m.GeneradorQrComponent),
  },
  {
    path: 'admin/facturas',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/historial-facturas/historial-facturas.component').then((m) => m.HistorialFacturasComponent),
  },

  {
    path: '',
    loadComponent: () => import('./features/autenticacion/selector-rol/selector-rol.component').then((m) => m.SelectorRolComponent),
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
