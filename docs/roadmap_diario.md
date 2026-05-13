# Roadmap de Desarrollo: Planificación por Fases

Este documento detalla el plan de acción completo para construir **Trace**, un sistema integral de gestión de comandas con accesibilidad alimentaria. El proyecto abarca dos verticales:

- **B2C (Cliente Final):** El comensal escanea el QR de su mesa, configura su perfil de alérgenos, consulta la carta filtrada, monta su pedido y realiza el seguimiento en tiempo real desde su móvil.
- **B2B (Staff del Restaurante):** Los trabajadores del bar/restaurante reciben, gestionan y despachan los pedidos desde un panel de administración, con separación inteligente entre **Barra** (bebidas) y **Cocina** (comidas).

Cada fase se ha diseñado siguiendo criterios académicos, promoviendo la resiliencia del software y manteniendo los estándares de Clean Architecture.

> **Nota de versionado.** Las fechas ISO asociadas a cada hito han sido reconstruidas a partir del historial real de commits del repositorio (`git log --reverse`). Se conserva la numeración correlativa de hitos por simplicidad expositiva; las marcas duplicadas o saltos cronológicos de versiones previas de este documento han sido normalizadas.

---

## Resumen del Estado Actual (12 de mayo de 2026)

| Fase | Nombre | Ventana temporal | Estado |
|------|--------|------------------|--------|
| 0 | Configuración base y Clean Architecture | 2026-04-11 | ✅ Completada |
| 1 | Identidad y Acceso del Comensal | 2026-04-13 | ✅ Completada |
| 2 | El Menú Digital Inteligente | 2026-04-13 → 2026-04-26 | ✅ Completada |
| 3 | Autogestión del Carrito de la Comanda | 2026-04-26 | ✅ Completada |
| 4 | Sincronización en Tiempo Real con la Nube | 2026-04-26 → 2026-04-29 | ✅ Completada |
| 5 | Modelo de Destinos y Comandas Múltiples | 2026-04-29 | ✅ Completada |
| 6 | Panel de Administración B2B (Staff) | 2026-05-04 | ✅ Completada |
| 7 | Vista de Cocina en Tiempo Real (KDS) | 2026-05-06 | ✅ Completada |
| 8 | Gestión de la Carta Avanzada (Backoffice) | 2026-05-07 | ✅ Completada |
| 9 | Analítica, Stock y Generador QR | 2026-05-09 | ✅ Completada |
| 10 | Auditoría, Seguridad y PWA | 2026-05-09 → 2026-05-10 | ✅ Completada |
| 11 | Facturación Veri\*factu y Endurecimiento Fiscal | 2026-05-09 → 2026-05-12 | 🟡 En consolidación |

---

## Fase 0 — Configuración base (2026-04-11)
- **Commit de referencia:** `a788ab6` — *init: configuración base del TFG, Clean Architecture y modelado de datos B2C*.
- **Propuesta:** Inicializar el repositorio con estructura `core` / `shared` / `features` y modelar las interfaces de dominio (`Producto`, `LineaComanda`, `PerfilUsuario`).

---

## Fase 1 — Identidad y Acceso del Comensal (2026-04-13)

### Hito 1.1: Pantalla de Check-in y Perfil Médico
- **Propuesta:** Diseñar y programar el componente Standalone de Bienvenida (`features/autenticacion`).
- **Artefactos:** `CheckInComponent`, interfaz `PerfilUsuario`, iconos SVG de alérgenos.
- **Commit de referencia:** `13d97aa` — rediseño visual de la entrada del cliente.

### Hito 1.2: Vinculación del Estado Global
- **Propuesta:** Implementar el paradigma de reactividad nativa (Angular Signals) para preservar identidad y restricciones del cliente entre vistas.
- **Artefactos:** `UsuarioService` con `signal()`, `computed()` y persistencia en `localStorage`.

---

## Fase 2 — El Menú Digital Inteligente (2026-04-13 → 2026-04-26)

### Hito 2.1: Maquetación de la Carta Base
- **Propuesta:** Desarrollar el componente visual de la carta (`features/carta`) con datos asíncronos.
- **Artefactos:** `CartaComponent`, interfaz `Producto`, `CartaService`.

### Hito 2.2: Motor Central de Filtrado de Alérgenos
- **Propuesta:** Algoritmo que cruza el perfil del usuario con los alérgenos del plato, bloqueando elementos peligrosos.
- **Artefactos:** `computed()` cruzado, UI con bloqueo visual (filtro `grayscale` + *overlay* informativo).

---

## Fase 3 — Autogestión del Carrito de la Comanda (2026-04-26)

### Hito 3.1: Lógica del Carrito Flotante
- **Propuesta:** Construir el `ComandaService` y la píldora flotante interactiva.
- **Artefactos:** `ComandaService` reactivo, `ResumenFlotanteComponent`.

### Hito 3.2: Pantalla de Resumen y Confirmación
- **Propuesta:** Desarrollar `resumen-comanda` para revisar el desglose, añadir notas y confirmar la orden.
- **Artefactos:** `ResumenComandaComponent` con *stepper* de cantidad y notas a cocina.

---

## Fase 4 — Sincronización en Tiempo Real con la Nube (2026-04-26 → 2026-04-29)

### Hito 4.1: Conexión de la Comanda a Firestore
- **Propuesta:** Integrar Firebase Auth Anónima y Firestore para persistir pedidos.
- **Artefactos:** `ComandaFirestoreService`, autenticación anónima.
- **Commit de referencia:** `7f6efe3` — flujo completo B2C hasta envío a Firestore.

### Hito 4.2: Seguimiento de Comanda en Tiempo Real
- **Propuesta:** Implementar escucha activa (`onSnapshot`) para que el comensal vea el progreso de su pedido.
- **Artefactos:** `SeguimientoComandaComponent` con *stepper* de estados.

### Hito 4.3: Persistencia de Sesión y Auto-llenado por QR
- **Propuesta:** Sincronizar el estado reactivo con `localStorage` y leer `?mesa=` de la URL del QR físico.
- **Artefactos:** `UsuarioService` y `ComandaService` con persistencia; *badge* `qr-badge` y `readonly` en el campo de mesa.
- **Commit de referencia:** `7f24cde`.

---

## Fase 5 — Modelo de Destinos y Comandas Múltiples (2026-04-29)

### Hito 5.1: Ampliación del Modelo de Datos
- **Propuesta:** Separación por destinos (`BARRA` / `COCINA`) y soporte para múltiples rondas por mesa.
- **Artefactos:** *Query* filtrada única en Firestore (`where idCliente + where idMesa + orderBy fechaCreacion`), *signal* `todasLasComandas`, índice compuesto.

---

## Fase 6 — Panel de Administración B2B (Staff) (2026-05-04)

### Hito 6.1: Infraestructura y Seguridad B2B
- **Propuesta:** Inicio de sesión para el staff y protección de rutas con `adminGuard`.
- **Artefactos:** `LoginAdminComponent`, `AdminAuthService`.

### Hito 6.2: Panel de Pedidos
- **Propuesta:** Centro de mando reactivo para gestionar el ciclo de vida de los pedidos.
- **Artefactos:** `PanelPedidosComponent`, gestión de estados (Aceptar → Servido → Pagado).

### Hito 6.3: Historial y Notificaciones
- **Propuesta:** Pestaña de historial e implementación de notificaciones sonoras nativas.
- **Artefactos:** Web Audio API (campanilla), pestaña Historial.
- **Commit de referencia:** `4e742b4`.

---

## Fase 7 — Vista de Cocina en Tiempo Real (2026-05-06)

### Hito 7.1: Tablero de Producción y Separación de Roles
- **Propuesta:** Vistas especializadas para cocineros y barman con lógica de agrupación de platos.
- **Artefactos:** `VistaCocinaComponent`, `VistaBarraComponent`, lógica de agregación en `AdminComandaService`.

### Hito 7.2: Design System y Modo Oscuro
- **Propuesta:** Tokens de diseño en `global.scss` y persistencia de preferencias estéticas del usuario.
- **Artefactos:** Variables CSS semánticas, `UserSettingsService` con `localStorage`.
- **Commit de referencia:** `7da1958`.

---

## Fase 8 — Gestión de la Carta Avanzada (Backoffice) (2026-05-07)

### Hito 8.1: Módulo de Gestión de Productos (CRUD Pro)
- **Propuesta:** Panel administrativo avanzado con variantes de precio, modificadores y gestión de turnos.
- **Artefactos:** `FormularioProductoComponent`, `ListaProductosComponent`, `ProductoAdminService`.

### Hito 8.2: Horarios de Servicio y Ordenación Dinámica
- **Propuesta:** Sistema de control de turnos (Almuerzo / Cena) basado en `configuracion/general` y ordenación manual de la carta.
- **Artefactos:** `HorarioRestauranteService`, `CartaService` refactorizado (reactivo al tiempo).

### Hito 8.3: Centralización de Audio
- **Propuesta:** Servicio de audio centralizado para feedback táctil y sonoro en toda la aplicación.
- **Artefactos:** `AudioService` (Web Audio API).
- **Commit de referencia:** `63c827d`.

---

## Fase 9 — Analítica, Stock y Generador QR (2026-05-09)

### Hito 9.1: Dashboard de Métricas y Gestión de Stock
- **Propuesta:** Visualización de KPI de negocio, control de inventario en tiempo real y *auto-sold-out*.
- **Artefactos:** `MetricasService`, `ProductoAdminService` ampliado, `DashboardMetricasComponent`.

### Hito 9.2: Generador QR y Exportación Z (PDF)
- **Propuesta:** Herramienta para generar el QR dinámico de cada mesa (`?mesa=N`) y exportar cierre de caja a PDF.
- **Artefactos:** `GeneradorQrComponent`, integración con `jspdf` + `jspdf-autotable`.
- **Commit de referencia:** `78d475f`.

---

## Fase 10 — Auditoría, Seguridad y PWA (2026-05-09 → 2026-05-10)

### Hito 10.1: Reglas de Seguridad (Firestore Rules)
- **Propuesta:** Blindaje de la base de datos para que los clientes solo escriban sus propios pedidos.
- **Resultado:** `firestore.rules` distingue staff (no anónimo) de cliente y restringe las mutaciones del cliente al estado `PENDIENTE`.
- **Commit de referencia:** `4d3d4df`.

### Hito 10.2: Internacionalización y PWA
- **Propuesta:** Migración completa a `@ngx-translate/core` con diccionarios `es` y `en`; integración de `@angular/service-worker` para cacheo de recursos e instalación nativa en iOS / Android.
- **Artefactos:** Pipes `currency` y `date` reactivos al *locale*; *manifest* PWA.
- **Commit de referencia:** `94a2192`.

---

## Fase 11 — Facturación Veri\*factu y Endurecimiento Fiscal (2026-05-09 → 2026-05-12) 🟡 En consolidación

### Hito 11.1: Módulo de Facturación (modo demostración)
- **Propuesta:** Implementar el flujo de cobro de cuenta con factura conforme a los requisitos técnicos del RD 1007/2023.
- **Artefactos:** Colección `facturas` *append-only*, contador correlativo en `metadatos/contadores_facturas`, *hash* SHA-256 encadenado entre facturas, generación de PDF con `jsPDF`.
- **Commit de referencia:** `1b50e49`, `a034657`.

### Hito 11.2: Botón "Pedir la Cuenta" y Adaptación Admin Multi-Tema
- **Propuesta:** Cerrar el bucle B2C → B2B con un disparador visible para el staff y consolidar la coherencia visual del panel administrativo.
- **Artefactos:** Flag `solicitaCuenta` en `comandas`, regla específica en Firestore para permitir exclusivamente este cambio desde cliente, adaptación de modales y vistas admin al tema claro/oscuro.
- **Commit de referencia:** `9e170a5`, `738fc22`.

### Hito 11.3: Endurecimiento Pre-Defensa
- **Propuesta:** Revisión integral previa al tribunal.
- **Artefactos:** Restricción de `update` sobre `metadatos` a incrementos `+1` (anti-rebobinado), centralización del registro de iconos en un *provider* único, auditoría de literales i18n y rendimiento.
- **Commit de referencia:** `edd91b7`.

> **Estado.** La Fase 11 entrega los mecanismos técnicos exigidos por la normativa en modo demostración. La conexión productiva con los servicios de la AEAT (certificado de representante, alta como obligado tributario, QR oficial) queda como línea de trabajo futuro en [`trabajo_futuro.md`](trabajo_futuro.md).

---

## Diagrama del Flujo

1. **Cliente:** QR → Alérgenos → Carta → Pedido.
2. **Barra:** Acepta pedido → Prepara bebidas → Despacha comida.
3. **Cocina:** Prepara comida → Botón "Marchar".
4. **Sistema:** Notifica a cliente y barra → Pedido Servido.
5. **Cliente:** "Pedir la cuenta" → Staff cobra → Factura Veri\*factu (modo demo).
6. **Dueño:** Gestiona carta → Revisa métricas → Exporta cierre Z.
