# Trace — Gestión de Comandas para Bares y Restaurantes

**Proyecto de Fin de Grado · DAM 2.º curso · Manuel Aljama Muñoz · 2026**

Trace es una aplicación híbrida (PWA + app nativa Android) que digitaliza el ciclo completo de una comanda en bares y restaurantes, con **filtrado dinámico de alérgenos** y facturación conforme al RD 1007/2023 (Veri\*factu).

---

## Características principales

| Vertical | Funcionalidad |
|---|---|
| **B2C — Comensal** | Escanea QR de mesa · Configura 14 alérgenos EU · Carta filtrada · Pedido en tiempo real · Seguimiento de estado · Botón "Pedir la cuenta" |
| **B2B — Staff** | Panel KDS Cocina/Barra · Gestión de pedidos · Backoffice de carta (CRUD, turnos) · Dashboard de métricas · Cierre Z (PDF) · Generador QR |
| **Fiscal** | Factura SHA-256 encadenada · Numeración correlativa inalterable · Colección *append-only* · PDF con desglose de IVA |

## Stack tecnológico

- **Angular 20** (Standalone Components + Signals + Control Flow nativo)
- **Ionic 8** — componentes UI multiplataforma
- **Firebase BaaS** — Firestore (tiempo real), Auth (anónima B2C + email/password B2B)
- **Capacitor 8** — APK nativo Android (`com.trace.comandas`)
- **PWA** — `@angular/service-worker`, instalable sin tienda
- **TypeScript 5.9**, `@ngx-translate/core` (ES/EN), `jsPDF`

## Estructura del repositorio

```
TFG/
├── app-comandas/        # Código fuente Angular/Ionic
│   ├── src/app/
│   │   ├── core/        # Servicios, modelos, guards
│   │   ├── features/    # Componentes por feature (B2C + B2B)
│   │   └── shared/      # Componentes reutilizables
│   ├── android/         # Proyecto nativo Android (Capacitor)
│   └── public/          # Assets, manifest PWA
└── docs/                # Documentación técnica del proyecto
```

## Ejecución local

```bash
cd app-comandas
npm install
ionic serve
```

> Requiere un proyecto Firebase con Firestore habilitado. Ver `app-comandas/src/environments/`.

## Tests

```bash
cd app-comandas
npm test
```

28/28 tests passing · ESLint 0 errores · Build de producción limpio.
