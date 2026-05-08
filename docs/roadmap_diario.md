# Roadmap de Desarrollo: Planificación por Fases

Este documento detalla el plan de acción completo para construir **Trace**, un sistema integral de gestión de comandas con accesibilidad alimentaria. El proyecto abarca dos verticales:

- **B2C (Cliente Final):** El comensal escanea el QR de su mesa, configura su perfil de alérgenos, consulta la carta filtrada, monta su pedido y realiza el seguimiento en tiempo real desde su móvil.
- **B2B (Staff del Restaurante):** Los trabajadores del bar/restaurante reciben, gestionan y despachan los pedidos desde un panel de administración, con separación inteligente entre **Barra** (bebidas) y **Cocina** (comidas).

Cada fase se ha diseñado siguiendo criterios académicos, promoviendo la resiliencia del software y manteniendo los estándares de Clean Architecture.

---

## Resumen del Estado Actual (Mayo de 2026)

| Fase | Nombre | Estado |
|------|--------|--------|
| 1 | Identidad y Acceso del Comensal | ✅ Completada |
| 2 | El Menú Digital Inteligente | ✅ Completada |
| 3 | Autogestión del Carrito de la Comanda | ✅ Completada |
| 4 | Sincronización en Tiempo Real con la Nube | ✅ Completada |
| 5 | Modelo de Destinos y Comandas Múltiples | ✅ Completada |
| 6 | Panel de Administración B2B (Staff) | ✅ Completada |
| 7 | Vista de Cocina en Tiempo Real | ✅ Completada |
| 8 | Gestión de la Carta Avanzada (Backoffice) | ✅ Completada |
| 9 | Analítica, Stock y Features | 🔜 Pendiente |
| 10 | Auditoría, Seguridad y Entrega Final | 🔜 Pendiente |

---

## Fase 1: Identidad y Acceso del Comensal ✅

### Día 1: Pantalla de "Check-in" y Perfil Médico
- **Propuesta:** Diseñar y programar el componente Standalone de Bienvenida (`features/autenticacion`).
- **Artefactos:** `CheckInComponent`, interfaz `PerfilUsuario`, iconos SVG de alérgenos.

### Día 2: Vinculación del Estado Global
- **Propuesta:** Implementar el paradigma de reactividad nativa (Angular Signals) para guardar la identidad y restricciones del cliente.
- **Artefactos:** `UsuarioService` con `signal()`, `computed()` y persistencia en `localStorage`.

---

## Fase 2: El Menú Digital Inteligente ✅

### Día 3: Maquetación de la Carta Base
- **Propuesta:** Desarrollar el componente visual de la carta (`features/carta`) con datos asíncronos.
- **Artefactos:** `CartaComponent`, interfaz `Producto`, `CartaService`.

### Día 4: Motor Central de Filtrado de Alérgenos
- **Propuesta:** Algoritmo que cruza el perfil del usuario con los alérgenos del plato, bloqueando elementos peligrosos.
- **Artefactos:** `computed()` cruzado, UI con bloqueo visual (grayscale + overlay).

---

## Fase 3: Autogestión del Carrito de la Comanda ✅

### Día 5: Lógica del Carrito Flotante
- **Propuesta:** Construir el `ComandaService` y la píldora flotante interactiva.
- **Artefactos:** `ComandaService` reactivo, `ResumenFlotanteComponent`.

### Día 6: Pantalla de Resumen y Confirmación
- **Propuesta:** Desarrollar `resumen-comanda` para evaluar el desglose, añadir notas y confirmar la orden.
- **Artefactos:** `ResumenComandaComponent` con stepper y notas.

---

## Fase 4: Sincronización en Tiempo Real con la Nube ✅

### Día 8: Conexión de la Comanda a Firestore
- **Propuesta:** Integrar Firebase Auth Anónima y Firestore para persistir pedidos.
- **Artefactos:** `ComandaFirestoreService`, Auth Anónima.

### Día 9: Seguimiento de Comanda en Tiempo Real
- **Propuesta:** Implementar escucha activa (`onSnapshot`) para que el comensal vea el progreso de su pedido.
- **Artefactos:** `SeguimientoComandaComponent` con stepper de estados.

---

## Fase 5: Modelo de Destinos y Comandas Múltiples ✅

### Día 10: Ampliación del Modelo de Datos
- **Propuesta:** Separación por destinos (Barra/Cocina) y soporte para múltiples rondas por mesa.
- **Artefactos:** Query filtrada única en Firestore, Signal `todasLasComandas`.

---

## Fase 6: Panel de Administración B2B (Staff) ✅

### Día 11: Infraestructura y Seguridad B2B
- **Propuesta:** Login para el staff y protección de rutas con `AdminGuard`.
- **Artefactos:** `LoginAdminComponent`, `AdminAuthService`.

### Día 12: Panel de Pedidos (Barra/Caja)
- **Propuesta:** Centro de mando reactivo para gestionar el ciclo de vida de los pedidos.
- **Artefactos:** `PanelPedidosComponent`, gestión de estados (Aceptar -> Listo -> Servido).

### Día 13: Historial y Notificaciones
- **Propuesta:** Implementación de pestaña de historial y notificaciones sonoras nativas.
- **Artefactos:** Web Audio API (campanilla), Pestaña Historial.

---

## Fase 7: Vista de Cocina en Tiempo Real ✅

### Día 15: Tablero de Producción y Separación de Roles
- **Propuesta:** Vista especializada para cocineros y barman con lógica de agrupación de platos.
- **Artefactos:** `VistaCocinaComponent`, `VistaBarraComponent`, Lógica de Agregación en `AdminComandaService`.

### Día 16: Notificaciones y Modo Oscuro
- **Propuesta:** Avisos sonoros para nuevos pedidos y personalización estética del panel.
- **Artefactos:** Web Audio API, persistencia de tema en `localStorage`.

---

## Fase 8: Gestión de la Carta Avanzada (Backoffice) ✅

### Día 17: Módulo de Gestión de Productos (CRUD Pro)
- **Propuesta:** Implementación de un panel administrativo avanzado con soporte para variantes de precio, modificadores obligatorios/opcionales y gestión de turnos.
- **Artefactos:** `FormularioProductoComponent`, `ListaProductosComponent`, `ProductoAdminService`.

### Día 18: Horarios de Servicio y Ordenación Dinámica
- **Propuesta:** Sistema de control de turnos (Almuerzo/Cena) basado en la configuración de Firestore y ordenación manual de la carta.
- **Artefactos:** `HorarioRestauranteService`, `CartaService` refactorizado (reactivo al tiempo).

### Día 19: Centralización de Audio y UX
- **Propuesta:** Creación de un servicio de audio centralizado para feedback táctil y sonoro en toda la aplicación.
- **Artefactos:** `AudioService` (Web Audio API).

---

## Fase 9: Analítica, Stock y Features Pro 🔜

### Día 18: Dashboard de Métricas y Gestión de Stock ✅
- **Propuesta:** Visualización de Kpis de negocio, control de inventario en tiempo real y auto-sold-out.
- **Artefactos:** `MetricasService`, `ProductoAdminService` ampliado, `DashboardMetricasComponent`.

### Día 19: Generador de QR, Exportación y Multi-idioma
- **Propuesta 1 (Generador QR):** Herramienta para generar el QR dinámico de cada mesa (ej. ?mesa=1).
- **Propuesta 2 (Exportación Z):** [NUEVA MEJORA] Generar PDF de cierre de caja en el panel de métricas. ✅
- **Propuesta 3 (i18n):** Soporte básico para inglés y español.

---

## Fase 10: Auditoría, Seguridad y Entrega Final 🔜

### Día 20: Reglas de Seguridad (Firestore Rules)
- **Propuesta:** Blindaje de la base de datos para que los clientes solo escriban sus propios pedidos.

### Día 21: Refactorización y Despliegue Avanzado
- **Propuesta 1 (Ticket Electrónico):** [NUEVA MEJORA] Generación de ticket en blanco y negro para impresión térmica de comandas.
- **Propuesta 2 (PWA y Modo Offline):** [NUEVA MEJORA] Convertir la app en instalable (PWA) con Service Workers para resiliencia de red.
- **Propuesta 3 (Despliegue):** Limpieza final (100% Español + Control Flow) y subida a Firebase Hosting.

---

## Diagrama del Flujo

1. **Cliente:** QR -> Alérgenos -> Carta -> Pedido.
2. **Barra:** Acepta pedido -> Prepara bebidas -> Despacha comida.
3. **Cocina:** Prepara comida -> Botón "Marchar".
4. **Sistema:** Notifica a cliente y barra -> Pedido Servido.
5. **Dueño:** Gestiona carta -> Revisa métricas.
