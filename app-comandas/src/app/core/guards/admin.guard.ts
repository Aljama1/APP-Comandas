import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';

/**
 * Guard funcional que protege las rutas de administración (/admin/*).
 * Verifica si existe una sesión de Firebase Auth activa y NO anónima.
 */
export const adminGuard: CanActivateFn = async (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  try {
    // Usamos firstValueFrom para obtener el estado actual de la autenticación
    const user = await firstValueFrom(authState(auth));

    // Validamos: Si hay usuario y NO es anónimo (clientes B2C), concedemos acceso
    if (user && !user.isAnonymous) {
      return true;
    }

    // Si no cumple, redirigimos al login de staff guardando la ruta a la que quería ir
    return router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } });
  } catch (error) {
    console.error('Error en adminGuard:', error);
    return router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } });
  }
};
