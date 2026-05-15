# Trace — Gestión de Comandas para Bares y Restaurantes

**Proyecto de Fin de Grado · DAM 2.º curso · Manuel Aljama Muñoz · 2026**

Trace es una aplicación híbrida (PWA + app nativa Android) que digitaliza el ciclo completo de una comanda en bares y restaurantes, con **filtrado dinámico de alérgenos** y facturación conforme al RD 1007/2023 (Veri\*factu).

---

## Características principales

| Vertical | Funcionalidad |
|---|---|
| **B2C — Comensal** | Escanea QR de mesa · Configura 14 alérgenos EU · Carta filtrada en tiempo real · Pedido sin registro · Seguimiento de estado · Botón "Pedir la cuenta" |
| **B2B — Staff** | Panel KDS Cocina / KDS Barra · Gestión de pedidos en tiempo real · Backoffice de carta (CRUD + turnos) · Dashboard de métricas · Cierre Z (PDF) · Generador de QR por mesa |
| **Fiscal** | Factura SHA-256 encadenada · Numeración correlativa inalterable · Colección *append-only* en Firestore · PDF con desglose de IVA |

---

## Acceso a la aplicación

- **Comensal:** escanea el código QR de la mesa o accede con el parámetro `?mesa=N` (ej. `http://localhost:8100/?mesa=5`). Será redirigido al check-in.
- **Staff / admin:** navega a `/admin/login` e introduce las credenciales del establecimiento.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Angular 20 — Standalone Components + Signals + Control Flow nativo |
| UI | Ionic 8 — componentes multiplataforma |
| Backend | Firebase BaaS — Firestore (tiempo real), Auth (anónima B2C + email/password B2B) |
| Nativo Android | Capacitor 8 — APK `com.trace.comandas` |
| PWA | `@angular/service-worker` — instalable sin tienda |
| Lenguaje | TypeScript 5.9 |
| i18n | `@ngx-translate/core` (ES / EN) |
| PDF | `jsPDF` |

---

## Estructura del repositorio

```
TFG/
├── app-comandas/            # Código fuente Angular/Ionic
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/        # Servicios, modelos, guards
│   │   │   ├── features/    # Componentes por feature
│   │   │   │   ├── autenticacion/   # Check-in comensal, selector de rol
│   │   │   │   ├── carta/           # Carta con filtrado de alérgenos
│   │   │   │   ├── comandas/        # Resumen y seguimiento de comanda
│   │   │   │   └── admin/           # KDS cocina/barra, backoffice, métricas
│   │   │   └── shared/      # Componentes reutilizables
│   │   └── environments/    # Configuración Firebase por entorno
│   ├── android/             # Proyecto nativo Android (Capacitor)
│   └── public/              # Assets, manifest PWA, íconos
└── docs/                    # Memoria y documentación técnica del proyecto
```

---

## Ejecución local

### Requisitos previos

- Node.js 20+
- Angular CLI: `npm install -g @angular/cli`
- Ionic CLI: `npm install -g @ionic/cli`
- Una cuenta Firebase con un proyecto creado

### Configurar Firebase

1. En [console.firebase.google.com](https://console.firebase.google.com), crear un proyecto.
2. Activar **Firestore Database**, **Authentication** (anónimo + email/contraseña) y **Hosting**.
3. Copiar las credenciales del proyecto en `app-comandas/src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  firebase: {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "TU_PROYECTO",
    storageBucket: "TU_PROYECTO.firebasestorage.app",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
  }
};
```

### Arrancar la app

```bash
cd app-comandas
npm install
ionic serve
```

La app estará disponible en `http://localhost:8100`.

---

## Despliegue en Firebase Hosting (Opcional)

El proyecto está preparado para poder desplegarse en **Firebase Hosting** (sitio estático). La app es una SPA Angular compilada a `www/`.

```bash
cd app-comandas
firebase login                       # solo la primera vez
ng build --configuration=production  # genera www/
firebase deploy --only hosting       # publica el sitio estático
```

El `firebase.json` ya incluye el rewrite `** → /index.html` (necesario para que el router de Angular funcione en producción) y headers de cache para los assets versionados.

### Desplegar las reglas Firestore

```bash
cd app-comandas
firebase deploy --only firestore:rules
```

### Despliegue conjunto

```bash
cd app-comandas
ng build --configuration=production
firebase deploy
```

---

## Compilar APK Android

```bash
cd app-comandas
ng build --configuration=production
npx cap sync android
npx cap open android   # abre Android Studio
```

Desde Android Studio: **Build → Generate Signed APK / Bundle**.

El `applicationId` es `com.trace.comandas`, `minSdkVersion` según `android/variables.gradle`.

---

## Tests

```bash
cd app-comandas
npm test
```

28/28 tests passing · ESLint 0 errores · Build de producción limpio.

---

## Licencia

Este proyecto se distribuye bajo licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.
