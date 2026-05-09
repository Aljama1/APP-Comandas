import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

// Registro del locale español para CurrencyPipe y otros pipes de internacionalización
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
registerLocaleData(localeEs);

// Importaciones de Firebase (Arquitectura Standalone)
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

// Si estamos en producción, habilitamos el modo optimizado
if (environment.production) {
  enableProdMode();
}

import { importProvidersFrom, isDevMode } from '@angular/core';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader, TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader';
import { provideServiceWorker } from '@angular/service-worker';

// Función para cargar los archivos JSON de traducción
// En v17+, el loader inyecta HttpClient automáticamente, por lo que no necesita deps manuales
export function createTranslateLoader() {
  return new TranslateHttpLoader();
}

// Arrancamos la aplicación con todos los proveedores necesarios
bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(), 
    provideRouter(routes, withPreloading(PreloadAllModules)), 
    provideHttpClient(),
    
    // Configuración de Traducciones (UI Frontend)
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader
        }
      })
    ),
    // Token de configuración requerido por las nuevas versiones de TranslateHttpLoader
    {
      provide: TRANSLATE_HTTP_LOADER_CONFIG,
      useValue: { prefix: './assets/i18n/', suffix: '.json' }
    },

    // Configuración de Firebase
    provideFirebaseApp(() => initializeApp(environment.firebase)), 
    provideAuth(() => getAuth()), 
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          }), 
  ],
}).catch((err) => console.log(err));
