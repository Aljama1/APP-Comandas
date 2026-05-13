<div align="center">

# Trace · Sistema de Comandas para Hostelería

**Aplicación móvil y web para la gestión integral de pedidos en restaurantes, con filtrado dinámico de alérgenos, facturación legal encadenada (VeriFactu) y panel de operaciones en tiempo real.**

![Angular](https://img.shields.io/badge/Angular-20-DD0031?logo=angular&logoColor=white)
![Ionic](https://img.shields.io/badge/Ionic-8-3880FF?logo=ionic&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)
![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-TFG--Académica-lightgrey)

</div>

---

## Tabla de contenidos

1. [Visión del producto](#-visión-del-producto)
2. [Características principales](#-características-principales)
3. [Arquitectura](#-arquitectura)
4. [Stack tecnológico](#-stack-tecnológico)
5. [Estructura del proyecto](#-estructura-del-proyecto)
6. [Requisitos previos](#-requisitos-previos)
7. [Puesta en marcha](#-puesta-en-marcha)
8. [Pruebas en dispositivo móvil real](#-pruebas-en-dispositivo-móvil-real)
9. [Compilación y despliegue](#-compilación-y-despliegue)
10. [Modelo de datos](#-modelo-de-datos)
11. [Seguridad](#-seguridad)
12. [Scripts disponibles](#-scripts-disponibles)
13. [Roadmap](#-roadmap)
14. [Autoría](#-autoría)

---

## 🎯 Visión del producto

**Trace** es una plataforma B2C/B2B diseñada para digitalizar el flujo completo de servicio en un restaurante:

- El **cliente** escanea un QR en su mesa, consulta la carta filtrada por sus alérgenos y envía sus pedidos en rondas sucesivas, en tiempo real.
- La **cocina** y la **barra** reciben los tickets agregados por producto, con cantidades totales por servicio.
- El **personal de sala** dispone de un panel unificado de mesas abiertas, edición de líneas y cobro asistido.
- La **gerencia** obtiene métricas de venta, ranking de productos y cierres Z exportables a PDF.

Todo el flujo está respaldado por **facturación legal con encadenamiento criptográfico SHA-256** alineada con los requisitos de **VeriFactu** (AEAT).

---

## ✨ Características principales

### Para el cliente (B2C)
- 📱 Acceso por **QR de mesa** sin instalación previa (PWA).
- 🥗 **Carta dinámica con filtrado de alérgenos** (14 alérgenos del Reglamento UE 1169/2011).
- 🛒 Envío de **rondas múltiples** por sesión, con seguimiento en tiempo real.
- 💳 Botón **"Pedir la cuenta"** que notifica a sala.
- 🌐 **Multilenguaje** (Español / Inglés) con `@ngx-translate`.

### Para el personal (B2B)
- 🍳 Vistas dedicadas para **Cocina** y **Barra** con agregación por producto.
- 🧾 **Gestión de cuentas** con detección visual de mesas que llevan demasiado tiempo abiertas (umbrales de aviso y urgencia).
- ✏️ Edición de líneas (cantidad, precio) y eliminación con auditoría.
- 🔔 **Notificaciones sonoras** configurables para nuevos pedidos.
- 📊 **Dashboard de métricas**: KPIs operativos, ranking de productos y exportación a **Informe Z (PDF)**.
- 🔳 Generador de QR por mesa con vista de impresión optimizada.

### Cumplimiento legal y trazabilidad
- 🔐 Facturación con **hash encadenado SHA-256** (VeriFactu).
- 📑 Contador correlativo de facturas con serie configurable.
- 🧮 Desglose de **IVA al 10%** (hostelería) sobre precio final.
- 💾 Snapshot inmutable de productos en cada factura.
- ⚛️ Transacciones atómicas Firestore: factura + cierre de mesa garantizados en una sola operación.

---

## 🏗 Arquitectura

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  Cliente (PWA)  │         │  Admin / Sala   │         │  Cocina/Barra   │
│  Ionic + Ng     │         │  Ionic + Ng     │         │  Ionic + Ng     │
└────────┬────────┘         └────────┬────────┘         └────────┬────────┘
         │                           │                           │
         │ onSnapshot (query)        │ onSnapshot (query)        │ onSnapshot
         └───────────────┬───────────┴───────────────┬───────────┘
                         │                           │
                         ▼                           ▼
                ┌──────────────────────────────────────────┐
                │           Cloud Firestore                │
                │   colecciones: comandas · facturas ·     │
                │   productos · metadatos · usuarios       │
                └──────────────────────────────────────────┘
                         ▲
                         │ rules + auth
                         │
                ┌──────────────────────────────────────────┐
                │         Firebase Auth (admin)            │
                └──────────────────────────────────────────┘
```

Principios aplicados:

- **Clean Architecture por capas**: `core/` (servicios + modelos) · `features/` (vistas por flujo) · `shared/` (UI reutilizable).
- **Reactividad con Signals** (`signal`, `computed`) en lugar de RxJS para el estado de UI.
- **Listener único por query filtrada** en Firestore — evita N suscripciones y reduce coste.
- **Separación de responsabilidades**: `FacturacionService` aislado de `AdminComandaService` mediante inyector lazy para romper la dependencia circular.

---

## 🛠 Stack tecnológico

| Capa             | Tecnología                                              |
| ---------------- | ------------------------------------------------------- |
| Framework UI     | **Angular 20** (standalone components, signals)         |
| Móvil / PWA      | **Ionic 8** + **Capacitor 8**                           |
| Backend          | **Firebase** (Firestore, Auth, Hosting)                 |
| Empaquetado APK  | **Capacitor** (Android Studio)                          |
| i18n             | `@ngx-translate/core`                                   |
| PDFs             | `jsPDF` + `jspdf-autotable`                             |
| Iconografía      | `ionicons`                                              |
| Testing          | **Karma** + **Jasmine**                                 |
| Linting          | ESLint + `@angular-eslint`                              |
| Lenguaje         | **TypeScript 5.9**                                      |

---

## 📁 Estructura del proyecto

```
app-comandas/
├── src/
│   ├── app/
│   │   ├── core/                  # Lógica de negocio (servicios, modelos, guards)
│   │   │   ├── models/            # Comanda, Factura, Producto, Usuario, ...
│   │   │   ├── providers/         # Registro centralizado de iconos
│   │   │   └── services/          # Firestore, auth, métricas, facturación, audio
│   │   ├── features/              # Flujos funcionales (1 módulo = 1 dominio)
│   │   │   ├── admin/             # Panel pedidos, cocina, barra, cuentas, métricas, QR
│   │   │   ├── autenticacion/     # Check-in con QR de mesa
│   │   │   ├── carta/             # Carta con filtrado de alérgenos
│   │   │   └── comandas/          # Resumen y seguimiento del pedido del cliente
│   │   ├── shared/                # Componentes UI reutilizables
│   │   ├── app.component.ts
│   │   └── app.routes.ts
│   ├── assets/
│   │   ├── i18n/                  # es.json, en.json
│   │   └── fonts/                 # Tipografías geométricas
│   └── theme/                     # Variables CSS y dark mode
├── firestore.rules                # Reglas de seguridad de Firestore
├── firebase.json
├── capacitor.config.ts
├── angular.json
└── package.json
```

---

## ✅ Requisitos previos

- **Node.js 18+** y **npm 9+**
- **Ionic CLI** global → `npm install -g @ionic/cli`
- Cuenta de **Firebase** con un proyecto que tenga Firestore y Auth activados
- Para builds nativas: **Android Studio** (SDK 33+) o **Xcode** (macOS)

---

## 🚀 Puesta en marcha

```bash
# 1. Clonar e instalar dependencias
git clone <repo-url>
cd app-comandas
npm install

# 2. Configurar las credenciales de Firebase
#    Editar src/environments/environment.ts con tu firebaseConfig

# 3. Servir en local
npm start
# o equivalente:
npx ionic serve
```

La aplicación queda disponible en `http://localhost:8100`.

> **Importante:** antes del primer arranque, crea en Firestore el documento `metadatos/contadores_facturas` con la siguiente forma — es indispensable para emitir facturas:
>
> ```json
> { "serieActual": "F26", "ultimoNumero": 0, "ultimoHash": "GENESIS" }
> ```

---

## 📲 Pruebas en dispositivo móvil real

Para probar la app en un teléfono físico **sin generar APK**, mediante la red Wi-Fi local:

1. Conecta el PC y el móvil a la **misma red Wi-Fi**.
2. Ejecuta desde la raíz del proyecto:

   ```bash
   npx ionic serve --external
   ```

3. La terminal mostrará una URL del tipo `http://192.168.1.55:8100`.
4. Abre esa URL en el **navegador del móvil**.

> Cualquier cambio guardado en el código se refleja al instante en el dispositivo (Live Reload).

---

## 📦 Compilación y despliegue

### Build de producción (web / PWA)

```bash
npm run build
```

Genera la carpeta `www/` con el bundle optimizado.

### Despliegue en Firebase Hosting

```bash
firebase deploy --only hosting,firestore:rules
```

### Generación de APK Android (Capacitor)

```bash
npm run build
npx cap sync android
npx cap open android   # abre Android Studio para firmar y generar el APK
```

---

## 🗄 Modelo de datos

Colecciones principales en Firestore:

| Colección                          | Documento ejemplo                             | Propósito                                       |
| ---------------------------------- | --------------------------------------------- | ----------------------------------------------- |
| `comandas`                         | `{ idMesa, idCliente, lineasComanda, estado, precioTotal, fechaCreacion }` | Estado de las rondas activas y servidas |
| `facturas`                         | `{ numeroFactura, hashAnterior, hashActual, productos, importeTotal }`     | Facturas legales encadenadas (VeriFactu)|
| `productos`                        | `{ nombre, precio, alérgenos, stock, destino }` | Catálogo de carta                              |
| `metadatos/contadores_facturas`    | `{ serieActual, ultimoNumero, ultimoHash }`   | Contador y hash de la última factura emitida    |
| `usuarios`                         | `{ uid, nombre, alérgenos, mesaActual }`      | Sesión y preferencias del cliente               |

Máquina de estados de una comanda:

```
PENDIENTE → PREPARANDO → LISTO → SERVIDO → PAGADO
                 │
                 └──► CANCELADO  (si se eliminan todas las líneas)
```

---

## 🔒 Seguridad

- **Firestore Rules** restringen el acceso por `uid` y por rol de admin (`request.auth.token.admin == true`).
- El cliente sólo puede:
  - Crear sus propias comandas (`request.auth.uid == resource.data.idCliente`).
  - Activar el campo `solicitaCuenta` en sus propias comandas.
- Validación cruzada `uid + mesaId` antes de cualquier escritura mediante `MesaAccessValidatorService`.
- Inalterabilidad fiscal: las facturas son **inmutables** en reglas (no permiten `update` ni `delete`).
- El admin requiere autenticación con Firebase Auth y custom claim.

---

## 📜 Scripts disponibles

| Script           | Descripción                                          |
| ---------------- | ---------------------------------------------------- |
| `npm start`      | Sirve la app en modo desarrollo (`ng serve`)         |
| `npm run build`  | Compila para producción en `www/`                    |
| `npm run watch`  | Build incremental en modo desarrollo                 |
| `npm test`       | Ejecuta los tests unitarios con Karma                |
| `npm run lint`   | Linter Angular + TypeScript                          |

---

## 🗺 Roadmap

- [ ] Migrar facturación a Cloud Functions para firmar con certificado AEAT real.
- [ ] Integración con TPV físico (impresora térmica vía Bluetooth/USB).
- [ ] Modo offline-first con cola de sincronización.
- [ ] Panel de reservas y gestión de turnos.
- [ ] Multi-tenant (varios restaurantes en una misma instancia).

---

## 👤 Autoría

Proyecto desarrollado por **Manuel** como **Trabajo de Fin de Grado (TFG)**.

> Para cualquier duda sobre el código o la arquitectura, consulta `docs/arquitectura_proyecto.md` y `docs/backend_firebase.md`.
