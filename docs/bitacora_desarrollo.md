# Bitácora de Desarrollo — TFG Trace

Esta bitácora registra los hitos de desarrollo del proyecto **Trace** organizados por fase. Cada fase se documenta con la plantilla académica *Objetivo · Decisiones técnicas · Alternativas descartadas · Riesgos · Evidencia*, de modo que cada decisión queda trazada al código y al historial de Git que la respalda.

Las decisiones arquitectónicas estructurales se documentan en formato ADR en [`arquitectura_proyecto.md`](arquitectura_proyecto.md) (sección 0). El cronograma con fechas reales reconstruidas desde `git log` está disponible en [`roadmap_diario.md`](roadmap_diario.md) y como diagrama Gantt en [`diagramas.md`](diagramas.md).

---

## Visión global del producto

Aplicación híbrida con dos verticales sobre una misma base técnica:

- **B2C (cliente final).** Autogestión de comandas en restaurantes con filtrado dinámico de alérgenos. El comensal escanea el código QR de su mesa, configura su perfil con los 14 alérgenos del Reglamento UE 1169/2011, consulta una carta filtrada y envía su pedido con seguimiento en tiempo real.
- **B2B (personal del restaurante).** Panel de administración con separación por estación de trabajo (Barra para bebidas, Cocina para platos) y módulo fiscal Veri\*factu en modo demostración.

---

## Fase 1 — Identidad y acceso del comensal

**Commit de referencia:** `13d97aa` (2026-04-13).

### Objetivo
Implementar la entrada del cliente al sistema (`/check-in`) y el modelo de estado global de perfil del comensal.

### Decisiones técnicas
- **`CheckInComponent` Standalone.** Punto de entrada único tras el escaneo del QR. Se opta por una ruta limpia (`/check-in`) para que el QR físico pueda parametrizarse mediante `?mesa=N`.
- **`UsuarioService` basado en *signals*.** Estado de perfil expuesto como `signal()` y derivados (`alergenosActivos`, `tieneRestriccionesAlimentarias`) como `computed()`.

### Alternativas descartadas
- Uso de `BehaviorSubject` y `async pipe`: descartado por verbosidad y alineamiento con la dirección oficial de Angular (ver ADR-002).

### Evidencia
- `app-comandas/src/app/features/autenticacion/check-in.component.ts`
- `app-comandas/src/app/core/services/usuario.service.ts`

---

## Fase 2 — Menú digital con filtrado de alérgenos

### Objetivo
Renderizar la carta y bloquear visualmente los productos incompatibles con el perfil del comensal.

### Decisiones técnicas
- **Tipado estricto del dominio.** Interfaz `Producto` con `alergenos: Alergeno[]` (unión de literales de los 14 alérgenos UE).
- **Evaluación reactiva.** Un `computed()` cruza `usuarioService.alergenosActivos()` con `producto.alergenos[]` para determinar la seguridad de cada plato.
- **UI defensiva.** Los productos incompatibles no se eliminan del listado: se aplica filtro `grayscale`, se desactiva el botón de añadir y se muestra un *overlay* informativo. Se prioriza la transparencia sobre la ocultación, evitando dudas al comensal.

### Riesgos mitigados
- Que el comensal interprete la ausencia de un plato como temporal y pregunte al camarero. Resuelto mediante visibilidad explícita con bloqueo.

### Evidencia
- `app-comandas/src/app/features/carta/carta.component.ts`
- `app-comandas/src/app/core/models/producto.model.ts`

---

## Fase 3 — Autogestión del carrito de la comanda

### Objetivo
Permitir al comensal componer su pedido en local antes de confirmarlo, con feedback inmediato.

### Decisiones técnicas
- **`ComandaService` reactivo puro.** Carrito en memoria mediante `signal()`; total de artículos y subtotal como `computed()`, sin acceso al *backend* hasta la confirmación.
- **Nomenclatura de dominio.** Se sustituyen identificadores genéricos (`cartItem`, `total`) por términos de dominio (`LineaComanda`, `precioTotal`) para alinear el código con el vocabulario del sector HORECA.
- **`ResumenFlotanteComponent`.** Componente persistente con `backdrop-filter` (efecto de transparencia) sobre la vista de carta, visible solo cuando el carrito tiene elementos.
- **Validación cruzada de seguridad.** El botón "Añadir" comprueba la compatibilidad del producto con el perfil antes de permitir el evento, replicando la barrera ya impuesta por la UI.

### Evidencia
- `app-comandas/src/app/core/services/comanda.service.ts`
- `app-comandas/src/app/shared/components/resumen-flotante/`

---

## Fase 4 — Sincronización en tiempo real con Firestore

**Commit de referencia:** `7f6efe3` (2026-04-26), `7f24cde` (2026-04-29).

### Objetivo
Persistir las comandas en la nube y devolver al cliente actualizaciones de estado en tiempo real desde el panel del staff.

### Decisiones técnicas
- **Autenticación anónima B2C.** `signInAnonymously()` de Firebase Auth. Cada sesión recibe un UID único utilizado por las reglas de seguridad para autorizar mutaciones. Justificación completa en ADR-004.
- **`ComandaFirestoreService`.** Capa de adaptación entre el `ComandaService` reactivo y el SDK de Firestore. Aísla las llamadas a `addDoc`, `onSnapshot` y `updateDoc`.
- **Escucha bidireccional.** Tras confirmar la comanda, se inicia un *listener* `onSnapshot` que repinta el seguimiento del cliente ante cualquier cambio realizado por el staff.
- **Persistencia local de sesión.** `UsuarioService` y `ComandaService` sincronizan su estado con `localStorage`, garantizando recuperación frente a F5 o cortes de red. El `CheckInComponent` redirige automáticamente a `/carta` si detecta un perfil ya autenticado, eliminando el doble check-in.
- **Auto-llenado por QR.** Lectura de `ActivatedRoute.snapshot.queryParams['mesa']` para precargar y bloquear (`readonly`) el campo de mesa cuando el cliente accede mediante el QR físico.

### Riesgos mitigados
- **Pérdida de sesión por recarga.** Resuelta con persistencia en `localStorage`.
- **Inyección de contexto de AngularFire.** Resuelta envolviendo los *callbacks* de `onSnapshot` en `NgZone.run()` (consolidado en Fase 6).

### Evidencia
- `app-comandas/src/app/core/services/comanda-firestore.service.ts`
- `app-comandas/src/app/features/comandas/seguimiento-comanda/`

---

## Fase 5 — Modelo de destinos y comandas múltiples

### Objetivo
Reflejar la realidad operativa de un restaurante con separación entre Barra (bebidas) y Cocina (comidas), y permitir que una mesa curse varias rondas durante un mismo servicio.

### Decisiones técnicas
- **Tipo `DestinoReceptor`.** Unión literal `'BARRA' | 'COCINA'` definida en `producto.model.ts`.
- **Mapa centralizado `MAPA_DESTINO_CATEGORIA`.** Vincula cada `CategoriaProducto` con su destino; la asignación se realiza automáticamente en `ComandaService.agregarLinea()`.
- **Arquitectura de escucha por *query*.** Sustitución de la escucha sobre un único documento por una *query* filtrada (`where idCliente + where idMesa + orderBy fechaCreacion`). Una única conexión recupera todas las rondas de la sesión, resolviendo el caso de Ronda 1 en `PREPARANDO` y Ronda 2 en `PENDIENTE` simultáneamente.
- **`signal todasLasComandas`.** Origen único del que derivan todos los *computed* (`totalRondas`, `tieneComandas`, `comandaMasReciente`, `todasServidas`).
- **Persistencia por par `{idCliente, idMesa}`.** En lugar de almacenar un array de IDs, se persiste la clave de la *query*. Al recargar la sesión se reconstruye automáticamente.
- **Índice compuesto.** La *query* requiere índice (`idCliente` ASC, `idMesa` ASC, `fechaCreacion` ASC), documentado en `firestore.indexes.json`.

### Evidencia
- `app-comandas/src/app/core/services/comanda-firestore.service.ts`
- `firestore.indexes.json`

---

## Fase 6 — Panel de administración B2B

**Commit de referencia:** `4e742b4` (2026-05-04).

### Objetivo
Habilitar el acceso autenticado del personal y proporcionar el centro de mando reactivo para la gestión del ciclo de vida del pedido.

### Decisiones técnicas
- **`AdminAuthService`.** Autenticación email/contraseña distinta de la anónima del comensal. Las reglas de Firestore discriminan ambos casos mediante `request.auth.token.firebase.sign_in_provider`.
- **`adminGuard`.** Guardián funcional (`CanActivateFn`, vigente en Angular 20) que verifica autenticación no anónima antes de permitir acceso a `/admin/*`.
- **Escucha multi-estado.** `AdminComandaService` consume `where('estado', 'in', ['PENDIENTE', 'PREPARANDO', 'SERVIDO'])` aprovechando el índice (`estado` + `fechaCreacion`). División posterior por *signals* `computed` para alimentar las pestañas del panel sin lecturas adicionales.
- **Reactividad robusta en navegadores móviles.** Los *callbacks* de `onSnapshot` se envuelven en `NgZone.run()` para evitar renderizados fantasma y advertencias de *injection context* de AngularFire.
- **Ciclo de vida progresivo.** Botones "Aceptar Pedido" → "Entregar en Mesa" que actualizan el campo `estado` en Firestore, propagándose al móvil del comensal.
- **Filtros locales por `computed`.** Búsqueda por número de mesa mediante `<ion-searchbar>` evaluada en cliente, evitando lecturas adicionales a Firestore.
- **Detección de urgencia.** Método `esUrgente()`: si una comanda en estado activo supera los 10 minutos desde `fechaCreacion`, se aplica la clase `.tarjeta-urgente` con borde y animación.

### Evidencia
- `app-comandas/src/app/features/admin/panel-pedidos/`
- `app-comandas/src/app/core/services/admin-comanda.service.ts`
- `app-comandas/src/app/core/guards/admin.guard.ts`

---

## Fase 7 — Vista de cocina en tiempo real (KDS)

**Commit de referencia:** `7da1958` (2026-05-06).

### Objetivo
Proporcionar al personal de cocina y de barra una vista filtrada por su estación de trabajo, con agregación de cantidades entre mesas.

### Decisiones técnicas
- **Aislamiento por estación.** `VistaCocinaComponent` y `VistaBarraComponent` consumen el mismo `AdminComandaService` pero filtran las `LineaComanda` por su atributo `destino`, reduciendo el ruido visual.
- **Producción agregada.** Algoritmo en `AdminComandaService` que suma cantidades de productos idénticos procedentes de distintas mesas, permitiendo "marchar" varias raciones en paralelo.
- **Cierre de ciclo automático.** La comanda transita directamente a `SERVIDO` cuando todas sus líneas (barra y cocina) han sido marcadas como preparadas, ya que marcar = el producto ha salido a la mesa. No existe estado intermedio `LISTO`.
- **Sistema de diseño centralizado.** Tokens de color y estado en `global.scss`; persistencia de la preferencia de tema mediante `UserSettingsService` sobre `localStorage`.
- **Notificaciones sonoras nativas.** Síntesis con Web Audio API (oscilador a 3500 Hz) ante eventos `added` en la *query* de pendientes, evitando dependencia de archivos de audio.

### Evidencia
- `app-comandas/src/app/features/admin/vista-cocina/`
- `app-comandas/src/app/features/admin/vista-barra/`
- `app-comandas/src/app/core/services/user-settings.service.ts`

---

## Fase 8 — Gestión avanzada de la carta (backoffice)

**Commit de referencia:** `63c827d` (2026-05-07).

### Objetivo
Dotar al backoffice de un CRUD completo de productos con variantes y modificadores, e introducir inteligencia temporal (turnos) en la carta.

### Decisiones técnicas
- **Modelo enriquecido.** Producto con `variantes?: VarianteProducto[]` (raciones con precios) y `modificadores?: GrupoModificadores[]` (excluyentes u opcionales, obligatorios o no). Recálculo automático de subtotal en el carrito.
- **Formulario reactivo dinámico.** Uso de `FormArray` y *signals* para gestionar colecciones de variantes y modificadores en el panel de administración.
- **Motor de turnos.** `HorarioRestauranteService` escucha `configuracion/general` y expone el turno actual (`ALMUERZO` / `CENA`); `CartaService` añade un `computed()` que filtra la carta por turno, sin recarga manual.
- **Ordenación manual.** Campo `orden` para que el administrador controle la prelación visual de los platos.
- **`AudioService` unificado.** Síntesis centralizada (campana, clic de éxito) eliminando la dependencia de archivos `.mp3` y reduciendo el *bundle*.

### Evidencia
- `app-comandas/src/app/features/admin/gestion-carta/`
- `app-comandas/src/app/core/services/horario-restaurante.service.ts`
- `app-comandas/src/app/core/services/audio.service.ts`

---

## Fase 9 — Analítica, stock y herramientas administrativas

**Commit de referencia:** `78d475f` (2026-05-09).

### Objetivo
Cerrar el ciclo de negocio con métricas, control de inventario y herramientas físicas (QR, cierre Z).

### Decisiones técnicas
- **`MetricasService`.** KPI de ventas y *ranking* de productos calculados sobre la colección de comandas en estado `SERVIDO`/`PAGADO`.
- **Auto-sold-out.** Campo `stock` en `Producto`. Cuando llega a 0, la propiedad derivada `agotado` se activa y la carta muestra *badge* "AGOTADO" deshabilitando el botón "Añadir".
- **Generador QR dinámico.** `GeneradorQrComponent` produce URLs con `?mesa=N` y exporta el código QR a PNG y a documento imprimible para uso físico.
- **Exportación cierre Z.** Integración de `jspdf` y `jspdf-autotable` para transformar los *signals* de `MetricasService` en un PDF de cierre de caja con KPI y *ranking*. Estados de carga (`disabled`, *spinner*) protegen ante exportaciones vacías.

### Evidencia
- `app-comandas/src/app/features/admin/generador-qr/`
- `app-comandas/src/app/features/admin/historial-facturas/`

---

## Fase 10 — Auditoría, seguridad, PWA e internacionalización

**Commit de referencia:** `4d3d4df`, `94a2192` (2026-05-09 → 2026-05-10).

### Objetivo
Endurecer la base de datos, internacionalizar la aplicación e instalarla como PWA.

### Decisiones técnicas
- **Reglas de Firestore.** `firestore.rules` distingue staff (proveedor `password`) de cliente (proveedor `anonymous`). El cliente solo puede leer y mutar sus propias comandas; las mutaciones más allá de `PENDIENTE` quedan restringidas a `solicitaCuenta = true`. Los productos son de lectura pública.
- **Internacionalización.** Migración completa a `@ngx-translate/core` con diccionarios `es.json` y `en.json`; pipes `currency` y `date` reactivos al *locale*.
- **Migración de sintaxis a Control Flow.** Sustitución de `*ngIf`/`*ngFor` por `@if`/`@for`/`@switch` (API nativa desde Angular 17, vigente en Angular 20).
- **Progressive Web App.** Integración de `@angular/service-worker` para cacheo de recursos, instalación en iOS/Android y resiliencia ante redes Wi-Fi inestables —común en hostelería—.

### Evidencia
- `app-comandas/firestore.rules`
- `app-comandas/src/assets/i18n/{es,en}.json`
- `app-comandas/ngsw-config.json`

---

## Fase 11 — Facturación Veri\*factu y endurecimiento fiscal (en consolidación)

**Commit de referencia:** `1b50e49`, `a034657`, `edd91b7`, `9e170a5`, `738fc22` (2026-05-09 → 2026-05-12).

### Objetivo
Implementar los mecanismos técnicos exigidos por el RD 1007/2023 (Veri\*factu) en modo demostración y consolidar la robustez del sistema previa a la defensa.

### Decisiones técnicas
- **Colección `facturas` *append-only*.** Reglas de Firestore prohíben `update` y `delete` sobre cualquier factura emitida.
- **Numeración correlativa inalterable.** Documento `metadatos/contadores_facturas` con regla que solo admite `ultimoNumero = previo + 1` y `serieActual` invariable, bloqueando cualquier rebobinado de la cadena fiscal.
- **Encadenamiento SHA-256.** Cada factura calcula `hashActual = SHA-256(numero | fecha | total | hashAnterior)` mediante `crypto.subtle.digest` (Web Crypto API). La autorrelación implementa la cadena de integridad auditable.
- **Atomicidad.** La emisión de factura se ejecuta dentro de `runTransaction()`, garantizando que el incremento del contador y la creación del documento sean indivisibles. Detalle visual en el diagrama de secuencia de [`diagramas.md §3`](diagramas.md#3-secuencia-de-emisión-de-factura-verifactu-modo-demostración).
- **Generación de PDF.** Documento con desglose de IVA por tipo impositivo, datos del emisor y QR informativo, producido en cliente con `jsPDF` + `jspdf-autotable`.
- **Flag `solicitaCuenta`.** Campo booleano en `comandas` con regla específica que permite al cliente anónimo cambiarlo a `true` sin tocar el resto de campos, en cualquier estado de la comanda. El panel admin muestra aviso visual en la mesa correspondiente.
- **Provider centralizado de iconos.** Refactorización del registro de Ionicons en un único *provider*, eliminando duplicaciones y mejorando el *tree-shaking*.
- **Adaptación al tema claro/oscuro.** Auditoría exhaustiva de modales y vistas administrativas para que respeten las variables CSS de tematización de forma consistente.

### Riesgos asumidos
- **Conexión productiva con la AEAT.** Queda fuera del alcance del TFG por requerir certificado de representante y alta como obligado tributario. Documentado como línea de consolidación en [`trabajo_futuro.md`](trabajo_futuro.md).

### Evidencia
- `app-comandas/src/app/core/models/factura.model.ts`
- `app-comandas/src/app/core/services/facturacion.service.ts`
- `app-comandas/firestore.rules`

---

## Fase 12 — Corrección de fallos lógicos (auditoría pre-defensa)

**Commit de referencia:** (2026-05-13).

### Objetivo
Eliminar inconsistencias lógicas detectadas en la auditoría de código previas a la defensa del TFG: un salto ilegal de estado en la máquina de comandas, un posible NaN en el cobro de mesas, un desajuste de redondeo fiscal, código muerto peligroso en facturación, nomenclatura incorrecta en métricas y varias fragilidades menores.

### Decisiones técnicas

- **Eliminación del estado `LISTO` de la máquina de comandas.** El estado `LISTO` fue diseñado originalmente como paso intermedio entre `PREPARANDO` y `SERVIDO`, representando "preparado en cocina, pendiente de recogida por el camarero". Tras la auditoría se constató que no encajaba con el flujo real del restaurante: en este modelo, marcar un ítem en cocina/barra **significa que el producto ya ha salido a la mesa** — el personal lleva el plato al mismo tiempo que lo marca. Mantener `LISTO` generaba código muerto en toda la pila (`EstadoComanda`, `pedidosEnCurso`, query Firestore, `getLabelEstado`, stepper del cliente, traducciones i18n, manual y memoria) sin aportar valor al flujo. Se elimina completamente de tipo, servicios, componentes, traducciones y documentación. La máquina de estados queda como `PENDIENTE → PREPARANDO → SERVIDO → PAGADO / CANCELADO`. La decisión queda documentada como ADR-006 en `arquitectura_proyecto.md`.

- **Protección contra NaN en totales de mesa (`gestion-cuentas.component.ts`).** La acumulación `total += comanda.precioTotal` no protegía contra `undefined`. Se aplica `?? 0` en la inicialización y en el acumulador para evitar que un documento incompleto propague NaN al importe final mostrado en el cobro.

- **Redondeo de IVA fiscalmente correcto (`factura.model.ts`).** `calcularDesgloseIva` redondeaba `base` y `cuota` de forma independiente, lo que en ciertos importes produce `baseImponible + cuotaIva ≠ importeTotal`. La corrección redondea solo `baseImponible` y deriva `cuotaIva = importeTotal - baseImponible` ya redondeado, garantizando el cuadre aritmético exigido en una factura legal.

- **`finalizarCuentaMesa` convertida en `private` (`admin-comanda.service.ts`).** Desde que `FacturacionService.generarFactura` cierra las comandas dentro de su propia transacción atómica, este método público quedó sin llamadores externos y representa un riesgo: llamarlo solo cierra la mesa sin emitir factura. Se hace `private` y se documenta con `@deprecated`. El mock obsoleto en `facturacion.service.spec.ts` se elimina.

- **Semántica del KPI de tiempo (`metricas.service.ts`, `dashboard-metricas`).** El campo `tiempoMedioServicio` calculaba en realidad `fechaActualizacion (cobro) − fechaCreacion (primera ronda)`, que es el tiempo total de estancia en mesa, no el tiempo de preparación en cocina. Se renombra a `tiempoMedioEstancia` en la interfaz `KpiGeneral`, el servicio, el componente de dashboard y el informe Z en PDF para evitar confusión en la interpretación operativa.

- **Consistencia de timestamps (`admin-comanda.service.ts`, `facturacion.service.ts`).** Los updates de estado usaban `Date.now()` (reloj local del cliente) mientras la creación usaba `serverTimestamp()` (reloj del servidor). Se unifica todo a `serverTimestamp()` para eliminar el sesgo de relojes en métricas y evitar ordenaciones erróneas en Firestore.

- **Guard en `detenerEscucha` (`admin-comanda.service.ts`).** El contador `activeListeners` podía bajar a negativo si se llamaba `detenerEscucha` más veces de las que se había llamado a `iniciarEscuchaPedidosEntrantes`. Se añade un guard `if (activeListeners <= 0) return` al inicio del método para hacer la operación idempotente.

- **Restauración segura del DOM en `imprimirQr` (`generador-qr.component.ts`).** El elemento `.print-area` se movía al `<body>` para imprimir y se restauraba después de `window.print()`. Si el diálogo de impresión lanzaba una excepción, el elemento quedaba fuera de su posición original. Se envuelve la llamada en `try/finally` para garantizar la restauración en cualquier caso.

### Riesgos mitigados
- Cobros de mesa mostrando importe `NaN` al administrador.
- Facturas con cuadre aritmético incorrecto (base + cuota ≠ total).
- Comandas atascadas en estado `LISTO` sin salida automática (estado eliminado).
- Sesgo temporal en métricas al mezclar relojes locales y del servidor.

### Evidencia
- `app-comandas/src/app/core/services/admin-comanda.service.ts`
- `app-comandas/src/app/core/services/facturacion.service.ts`
- `app-comandas/src/app/core/services/metricas.service.ts`
- `app-comandas/src/app/core/models/factura.model.ts`
- `app-comandas/src/app/features/admin/gestion-cuentas/gestion-cuentas.component.ts`
- `app-comandas/src/app/features/admin/dashboard-metricas/dashboard-metricas.component.ts`
- `app-comandas/src/app/features/admin/generador-qr/generador-qr.component.ts`
- `app-comandas/src/app/core/services/facturacion.service.spec.ts`

---

---

## Fase 13 — Distribución nativa Android y cierre de proyecto (2026-05-13)

**Commit de referencia:** `6f37ec0`.

### Objetivo
Empaquetar la aplicación como APK nativo Android e instalarla en un dispositivo físico para la grabación del vídeo de defensa del TFG. Cerrar el repositorio con lint limpio, build de producción sin errores y 28/28 tests passing.

### Decisiones técnicas
- **Capacitor 8 como puente nativo.** La misma base de código Angular sirve para PWA y APK Android sin duplicar lógica. `capacitor.config.ts` configura `appId: com.trace.comandas`, ajustes de `StatusBar` (color corporativo, fondo oscuro) y `Keyboard` (resizes body, no scroll).
- **Icono personalizado generado programáticamente.** Script Node con `sharp` genera una imagen SVG con la "T" blanca sobre fondo `#1a1a1a` en 1024×1024. `@capacitor/assets` la distribuye a todos los tamaños `mipmap-*` de Android (92 assets) y al `favicon.png` de la PWA.
- **`manifest.webmanifest` actualizado.** `name: "Trace - Gestión de Comandas"`, `background_color: #0b0e14`, `theme_color: #0061ff`, modo `standalone`, `orientation: portrait`.
- **iOS soportado por arquitectura, no compilado.** Capacitor gestiona el proyecto iOS, pero la compilación de un IPA requiere Mac con Xcode — limitación de entorno de desarrollo, no del proyecto.
- **Limpieza del repositorio.** `.gitignore` actualizado para excluir artefactos de herramientas auxiliares (`node_modules/` raíz, scripts generadores, `resources/`, `docs/documentacion/`). Source control queda en 0 cambios pendientes.

### Evidencia
- `app-comandas/android/` (proyecto Capacitor Android completo)
- `app-comandas/capacitor.config.ts`
- `app-comandas/public/manifest.webmanifest`
- `app-comandas/ngsw-config.json`
- `app-comandas/src/assets/icon/favicon.png`

---

*Última actualización: 13 de mayo de 2026. El estado de la documentación se gestiona en `roadmap_diario.md` (cronograma) y `arquitectura_proyecto.md` (ADR estructurales).*
