# Bitácora de Desarrollo - TFG Comandas y Alérgenos

Este documento registra los hitos y pasos clave en el desarrollo del proyecto.

## Visión del Proyecto (B2C + B2B)
Aplicación Híbrida con dos verticales:
- **B2C (Cliente Final):** Autogestión de comandas en restaurantes con enfoque en la accesibilidad alimentaria y filtro de alérgenos. El comensal escanea el QR de su mesa, configura su perfil médico, consulta una carta filtrada y envía su pedido con seguimiento en tiempo real.
- **B2B (Staff del Restaurante):** Panel de administración para que los trabajadores reciban, acepten y despachen pedidos, con separación inteligente entre **Barra** (bebidas) y **Cocina** (comidas).

---

## Hitos del Proyecto

### Semana 1: Configuración Inicial e Infraestructura (Completado)
- **Definición del Roadmap**: Se estableció el plan de desarrollo, pruebas y documentación del TFG usando el enfoque "Client-First" (B2C).
- **Preparación del Entorno (Clean Architecture)**: 
    - Selección estricta de stack tecnológico: Angular 20 (100% Standalone) + Ionic 8 + Firebase.
    - Estructura de dominios: `core`, `shared`, `features` (auth, menu, orders, tables).
    - Creación de carpeta de documentación académica (`/docs`).
- **Configuración Git**: Repositorio inicializado y saneado de forma formal para la revisión del profesorado.

### Fase 1: Identidad y Acceso del Comensal (Completado)

#### Día 1: Interfaz de Bienvenida y Perfil de Usuario (Completado)
- **Hito**: Implementación del esqueleto del `CheckInComponent` como pieza central de la entrada del cliente.
- **Detalles técnicos**:
    - **Enfoque Standalone**: Uso de componentes independientes para optimizar el bundle y facilitar el testing unitario futuro.
    - **Diseño UI/UX (Minimalist White)**: Implementación de un diseño limpio estilo Apple para reducir la carga cognitiva del cliente.
    - **Reactividad Base**: Integración de `FormsModule` para capturar el `Nombre` y `MesaID` mediante "Two-way data binding".
- **Decisión de Arquitectura**: Se optó por un diseño de "ruta limpia" (`/check-in`) como acceso único para el comensal tras el escaneo del código QR.

#### Día 2: Vinculación del Estado Global (Completado)
- **Hito**: Migración de datos locales a estado global persistente mediante **Angular Signals**.
- **Detalles técnicos**:
    - **UsuarioService**: Creación de un servicio centralizado en `core/services` para gestionar el perfil del comensal.
    - **Reactividad Avanzada**: Uso de `signal` y `computed` para un flujo de datos unidireccional y eficiente.
    - **Persistencia en Memoria**: El sistema ya "recuerda" quién es el cliente y qué alérgenos padece para las siguientes fases.

### Fase 2: El Menú Digital Inteligente (Completado)

#### Día 3: Maquetación de la Carta Base (Completado)
- **Hito**: Desarrollo visual de `features/carta` con iteración sobre productos estáticos (Mock Data).
- **Detalles técnicos**:
    - **Renderizado Dinámico**: Implementación de interfaces `Producto` para tipado estricto.
    - **Estilos Adaptativos**: Tarjetas responsivas enfocadas a la interacción móvil con animaciones de entrada (`fade-in`).

#### Día 4: Motor Central de Filtrado de Alérgenos (Completado)
- **Hito**: Integración cruzada del `UsuarioService` con `CartaService` y lógica de evaluación visual.
- **Detalles técnicos**:
    - **Evaluación Computada**: `computed()` evalúa la seguridad de cada producto (Alergias Usuario vs Alérgenos Producto).
    - **UI/UX Segura (Bloqueo y Difuminado)**: Los productos letales no desaparecen (para evitar confusión e informar al cliente), pero se bloquea el botón de interacción, se aplica el filtro grayscale, y se añade un overlay informando de la incompatibilidad.

### Fase 3: Autogestión del Carrito de la Comanda (Completado)

#### Día 5: Lógica del Carrito Flotante (Completado)
- **Hito**: Construcción del `ComandaService` y la interfaz visual interactiva de la bandeja flotante (`ResumenFlotanteComponent`).
- **Detalles técnicos**:
    - **Servicio Reactivo Puro**: Uso avanzado de `Signals` y `computed` en `comanda.service.ts` para tabular el carrito en memoria (Total de artículos y Subtotal) de manera instantánea y síncrona, desvinculando la base de datos hasta la Fase 4.
    - **Modelado Robusto (Dominio)**: Refactorización de nomenclaturas anglosajonas/genéricas a jerga de dominio (`LineaComanda`).
    - **Micro-interacciones y UI Premium**: Diseño del componente tipo "Píldora Flotante" con CSS `backdrop-filter` (Glassmorphism) oscuro, situado por encima de la vista de la Carta. La píldora se anima desde abajo únicamente cuando existen elementos seleccionados.
    - **Cruce de Capas de Seguridad**: El botón de "Añadir a la comanda" sigue estrictamente las instrucciones del `UsuarioService` de la Fase 1 interconectado en la tabla de productos de la Fase 2, denegando el evento clic si está marcado como peligroso.

#### Día 6: Pantalla de Resumen y Confirmación (Completado)
- **Hito**: Construida la vista del carrito final (`ResumenComandaComponent`) donde se detalla la orden global, se confirman los totales, y se provee comunicación fluida de requerimientos a cocina.
- **Detalles técnicos**:
    - **Enrutamiento Estricto**: Integración del enrutador Angular (`Router.navigateByUrl`) en la píldora flotante y el botón del carrito para saltar a `/resumen-comanda`.
    - **Manejo Interactivo (Componente Stepper)**: Uso del `ComandaService` para alterar las cantidades (`+`, `-`) dentro de las tarjetas individuales Glassmorphism. El botón "restar" muta dinámicamente a icono de "papelera" (`trash-outline`) cuando la cantidad es 1, indicando visualmente la eliminación.
    - **Notas Especiales Nativas**: Inclusión de Ionic `AlertController` para solicitar al comensal notas de cocina usando el teclado nativo del SO (modo `ios`).
    - **Estética Sleek Mesh**: Mantenimiento del patrón visual de gradientes con Glassmorphism para una percepción de producto alta gama.

#### Día 7: Mejoras de UX, Organización y Accesibilidad (Completado)
- **Hito**: Refinamiento integral de la interfaz de la Carta y del Resumen de Comanda tras validación funcional completa del flujo Check-in → Carta → Carrito → Resumen → Confirmación.
- **Detalles técnicos**:
    - **Agrupación por Categorías**: Implementación de un `computed()` adicional (`productosPorCategoria`) que organiza los productos del menú en secciones ordenadas (Entrantes, Principales, Postres, Bebidas, Especiales) mediante etiquetas de dominio con emojis representativos. Uso de la etiqueta semántica `<section>` con encabezados `<h2>` por grupo.
    - **Feedback Visual al Añadir**: Se introdujo un `signal<string | null>` (`productoRecienAnadido`) que marca temporalmente (800ms) el producto recién añadido al carrito. El botón "+" muta visualmente a un check verde (`checkmark-outline`) con fondo `#34c759` y animación `scale(1.1)`, proporcionando retroalimentación inmediata al usuario.
    - **Navegación Secundaria ("Seguir Pidiendo")**: Adición del botón `btn-seguir-pidiendo` en el Resumen de Comanda, con variante "Explorar la carta" en el estado vacío. Permite al comensal regresar a la carta sin depender exclusivamente del botón de retroceso del header.
    - **Accesibilidad (ARIA)**: Incorporación exhaustiva de atributos `aria-label` en todos los botones interactivos (carrito, logout, stepper, notas, confirmar), `aria-hidden="true"` en iconos decorativos, roles semánticos (`role="list"`, `role="listitem"`, `role="alert"`, `role="status"`, `role="note"`, `role="group"`) y `aria-live="polite"` en cantidades y totales para lectores de pantalla. Uso de `<article>` como contenedor semántico de cada producto.
    - **Internacionalización (Locale)**: Registro del locale español (`registerLocaleData(localeEs)`) en `main.ts` para el correcto funcionamiento del `CurrencyPipe` con formato `'es'` en toda la aplicación.
    - **Funcionalidad de Cierre de Sesión**: Implementación de un botón de logout en la cabecera de la Carta con confirmación mediante `AlertController` (rol destructivo). Al confirmar, se vacía el perfil del usuario y el carrito, redirigiendo a `/check-in`.

### Fase 4: Sincronización en Tiempo Real con la Nube (Completado)

#### Día 8: Conexión de la Comanda a la Nube (Firestore) (Completado)
- **Hito**: Integración del ecosistema Firebase para dotar a la aplicación de persistencia real y gestión de identidades.
- **Detalles técnicos**:
    - **Estrategia Híbrida de Auth**: Implementación de `signInAnonymously()` de Firebase Auth. Esta decisión de diseño garantiza una experiencia "Zero-Friction" para el comensal, eliminando la necesidad de registro previo pero dotando a cada pedido de un UID (Unique Identifier) para trazabilidad de seguridad.
    - **Persistencia en Firestore**: Desarrollo del `ComandaFirestoreService`. Tras la confirmación del usuario, se transforma el objeto reactivo (Signal) en un documento NoSQL persistente, desvinculando la lógica de presentación de la capa de datos.
    - **Refactorización de Interfaz de Envío**: Inclusión de estados de carga (`LoadingController`) y diálogos de confirmación asíncronos en el `ResumenComandaComponent` para mejorar el feedback visual durante la comunicación con el servidor.
    - **Internacionalización de Activos**: Normalización del set de iconos de alérgenos (`gluten.svg`, `lactosa.svg`, `frutos-secos.svg`) garantizando consistencia semántica en todo el proyecto.

### Corrección Transversal: Normalización de Nomenclatura (Completado)

#### Auditoría y corrección de nomenclatura SCSS/HTML
- **Hito**: Refactorización integral de toda la nomenclatura personalizada en archivos de estilos (SCSS) y plantillas (HTML) para cumplir con la convención establecida de **español de España** en todo el código no obligatorio del stack.
- **Detalles técnicos**:
    - **Alcance**: Se identificaron y corrigieron ~80+ casos distribuidos en 8 archivos (4 pares SCSS/HTML): `check-in`, `carta`, `resumen-comanda` y `resumen-flotante`.
    - **Clases CSS**: Renombrado sistemático de todas las clases personalizadas (ej. `.allergies-section` → `.seccion-alergenos`, `.glass-panel` → `.panel-cristal`, `.product-card` → `.tarjeta-producto`, `.empty-state` → `.estado-vacio`).
    - **Variables SCSS**: Normalización de variables compartidas (ej. `$title-font` → `$fuente-titulo`, `$primary-dark` → `$oscuro-primario`, `$bg-color` → `$color-fondo`).
    - **Keyframes**: Traducción de animaciones (ej. `fadeIn` → `aparicionSuave`, `floatBackground` → `fondoFlotante`, `pulse` → `latido`, `slideUp` → `deslizarArriba`).
    - **Comentarios**: Traducción de comentarios en inglés residuales dentro de los archivos SCSS.
    - **Criterio**: Se respetó la nomenclatura obligatoria del stack (propiedades CSS nativas, directivas Angular, APIs de Ionic) manteniendo solo en inglés lo que el framework exige.

#### Día 8 (cont.): Mejoras de Robustez y Experiencia de Usuario (Completado)
- **Hito**: Refinamiento del flujo B2C con funcionalidades orientadas a la resiliencia de la sesión y la integración física (QR) con la plataforma digital.
- **Detalles técnicos**:
    - **Auto-llenado por QR (Mesas Inteligentes)**: Implementación de lectura de `queryParams` mediante `ActivatedRoute.snapshot` en el `CheckInComponent`. Si la URL contiene el parámetro `?mesa=X` (proveniente de un código QR físico), el campo de mesa se rellena automáticamente y se bloquea (`readonly`) con un indicador visual (`qr-badge`) que informa al usuario de que la mesa fue asignada por escaneo. Se optó por `snapshot` frente a `subscribe` para evitar suscripciones innecesarias y advertencias del contexto de inyección de Firebase.
    - **Persistencia de Sesión (localStorage)**: Refactorización del `UsuarioService` y `ComandaService` para sincronizar el estado reactivo (Signals) con `localStorage`. Al inicializar cada servicio, se intenta recuperar el perfil y el carrito del almacenamiento local. Cada mutación (`establecerPerfil`, `agregarLinea`, `vaciarComanda`, etc.) persiste automáticamente el estado actualizado. Esto garantiza que un refresco accidental del navegador (F5) no destruya la sesión del comensal ni su carrito de productos.
    - **Redirección Inteligente**: El `CheckInComponent` evalúa en su constructor si ya existe un perfil autenticado en memoria. De ser así, redirige automáticamente a `/carta`, eliminando la fricción de un doble check-in tras una recarga de página.

#### Día 9: Seguimiento de Comanda en Tiempo Real (Completado)
- **Hito**: Implementación completa del seguimiento en tiempo real de la comanda del cliente, cerrando el ciclo reactivo bidireccional entre el cliente y la nube.
- **Detalles técnicos**:
    - **Escucha Bidireccional (`onSnapshot`)**: Evolución del `ComandaFirestoreService` de escritura unidireccional a bidireccional. Se implementó `onSnapshot` para recibir actualizaciones push desde Firestore sin necesidad de polling.
    - **Signals Reactivos**: Exposición de estado mediante `signal()`: `estadoComandaActiva`, `datosComandaActiva` y `errorEscucha`. La vista se repinta instantáneamente ante cualquier cambio de estado realizado por el staff.
    - **`SeguimientoComandaComponent`**: Nueva vista `/seguimiento-comanda` con un stepper visual (rastreador) de 4 pasos: Recibida → En Preparación → Lista → Servida. Animaciones de pulso (`latidoSuave`) en el paso activo y transiciones suaves entre estados.
    - **Persistencia del ID**: El ID de la comanda activa se guarda en `localStorage` para que el seguimiento sobreviva a un refresco de página (F5).
    - **Flujo de Redirección**: Tras confirmar el envío en `ResumenComandaComponent`, el cliente es redirigido automáticamente a la pantalla de seguimiento.

### Fase 5: Modelo de Destinos y Comandas Múltiples (Completado)

#### Día 10: Ampliación del Modelo de Datos y Arquitectura de Escucha (Completado)
- **Hito**: Evolución del sistema de datos para reflejar la logística real de un restaurante, con separación inteligente de destinos de producción y soporte completo para múltiples rondas de pedidos por mesa.
- **Detalles técnicos**:
    - **Tipo `DestinoReceptor`**: Nuevo type literal `'BARRA' | 'COCINA'` definido en `producto.model.ts`. Determina a qué puesto de trabajo se despacha cada línea del pedido.
    - **Constante `MAPA_DESTINO_CATEGORIA`**: Mapa centralizado (`Record<CategoriaProducto, DestinoReceptor>`) que vincula automáticamente cada categoría del menú con su destino. Solo `'bebida'` va a `BARRA`; el resto a `COCINA`. Centralizar esta lógica en una constante facilita añadir nuevas categorías sin modificar la lógica de negocio dispersa.
    - **Campo `destino` en `LineaComanda`**: Cada línea del pedido ahora lleva su etiqueta de despacho. Se asigna automáticamente en `ComandaService.agregarLinea()` consultando el mapa, con fallback a `'COCINA'` si la categoría no está mapeada.
    - **Arquitectura de Escucha por Query (Cambio Crítico)**: Reescritura completa de `ComandaFirestoreService`. Se reemplazó el enfoque de listener individual (`onSnapshot` sobre un documento) por una **query filtrada única** (`where('idCliente') + where('idMesa') + orderBy('fechaCreacion')`). Una sola conexión WebSocket recibe actualizaciones de TODAS las rondas del cliente simultáneamente, resolviendo el caso de múltiples rondas activas (ej. Ronda 1 en PREPARANDO y Ronda 2 en PENDIENTE).
    - **Signal `todasLasComandas`**: Nuevo signal central que contiene el array completo de comandas, ordenado por fecha. Todas las señales derivadas (`totalRondas`, `tieneComandas`, `comandaMasReciente`, `estadoComandaActiva`, `todasServidas`) se calculan como `computed()` a partir de este array.
    - **Persistencia de Sesión por Query**: En lugar de guardar un array de IDs individuales, se persiste un par `{idCliente, idMesa}` en localStorage. Al recargar, se reconstruye la query completa, recuperando automáticamente todas las rondas de la sesión.
    - **Vista de Seguimiento Multi-Ronda**: El `SeguimientoComandaComponent` ahora muestra: (1) la ronda más reciente con stepper completo, (2) las rondas anteriores como tarjetas compactas con indicador de estado y mini-resumen. Todas se actualizan en tiempo real.
    - **Etiquetas de Destino Visuales**: Cada línea del resumen muestra su destino con iconos semánticos (🍺 Barra / 🔥 Cocina) y colores diferenciados (naranja para barra, rojo para cocina).
    - **Etiquetas de Estado Semánticas**: Cada ronda muestra un badge con su estado actual (Pendiente/Preparando/Lista/Servida) con colores diferenciados: amarillo, azul, verde claro y verde oscuro.
    - **Lógica de Acciones Refinada**: El botón "Pedir otra ronda" está siempre disponible (navega a `/carta` sin cerrar sesión). El botón "Cerrar sesión" solo aparece cuando TODAS las rondas han sido servidas (`todasServidas` computed).
    - **Índice Compuesto de Firestore**: La query requiere un índice compuesto (`idCliente` + `idMesa` + `fechaCreacion`). Firebase genera automáticamente un enlace directo en la consola del navegador para crearlo con un clic la primera vez que se ejecute.

### Fase 6: Panel de Administración B2B (Staff) y Logística (Completado)

#### Día 11: Infraestructura y Seguridad B2B
- **Hito:** Establecimiento del portal B2B protegido y separación lógica de roles de usuario.
- **Detalles técnicos:**
    - **`AdminAuthService`:** Implementación de autenticación de Firebase (Email/Contraseña) para el staff, garantizando que los usuarios anónimos (clientes) no interfieran.
    - **`adminGuard`:** Creación de un guardián de rutas funcional en Angular 18 que verifica activamente el estado de autenticación (no anónimo) antes de permitir acceso a `/admin/*`.
    - **UI Login B2B:** Vista premium (`LoginAdminComponent`) de estética oscura con manejo de errores y `LoadingController`.

#### Día 12: Panel de Pedidos (Barra) y Reactividad Avanzada
- **Hito:** Desarrollo del "centro de mando" del restaurante, capaz de gestionar el ciclo de vida completo de una comanda de forma reactiva.
- **Detalles técnicos:**
    - **Escucha Robusta (`NgZone` y Contextos):** Reestructuración de `AdminComandaService` y `ComandaFirestoreService` para envolver los callbacks de `onSnapshot` en `NgZone.run()`. Esto resuelve los problemas de renderizado fantasma en navegadores móviles cuando Firebase recibe datos en segundo plano, y limpia advertencias de *Injection Context* de AngularFire.
    - **Visibilidad Multiestado:** El servicio `AdminComandaService` escucha simultáneamente comandas en estado `PENDIENTE`, `PREPARANDO` y `LISTO` usando un operador `in`, reutilizando eficientemente el mismo índice compuesto (`estado` + `fechaCreacion`).
    - **Signals Computados (Tabs):** División dinámica de la señal maestra en `pedidosPendientes` y `pedidosEnCurso` mediante `computed()`, logrando un sistema de pestañas instantáneo (`<ion-segment>`) que no requiere múltiples consultas a BD.
    - **Ciclo de Vida Completo:** Implementación de botones de acción progresivos ("Aceptar Pedido" → "Marcar como Listo" → "Entregar en Mesa") que actualizan el `estado` en Firestore, disparando las actualizaciones en los móviles de los comensales.

#### Día 13: Refinamiento de Usabilidad Logística (Workstation UI)
- **Hito:** Adaptación de la UI a la realidad de las estaciones de trabajo mediante "Separación por Estación".
- **Detalles técnicos:**
    - **Filtro de Rol Dinámico:** Implementación de un `ion-toggle` ("Vista exclusiva de Barra") en `PanelPedidosComponent`. Al activarse, las líneas con destino `BARRA` se detallan al máximo, mientras que las de `COCINA` se colapsan en un único resumen visual (ej. *"3 platos para Cocina"*). Evita la saturación cognitiva del barman.
    - **Filtros Inteligentes Locales:** Incorporación de un `<ion-searchbar>` para buscar por número de mesa. El filtrado se realiza localmente a través de `computed signals` (`pedidosPendientesFiltrados`), ahorrando costes masivos en lecturas de Firestore.
    - **Alertas de Tiempo Visuales:** Implementación del método `esUrgente()`. Si una comanda (en `PENDIENTE` o `PREPARANDO`) excede los 10 minutos desde su `fechaCreacion`, la interfaz le aplica la clase `.tarjeta-urgente`, añadiendo un borde rojo pulsante y una animación de latido en el ícono del tiempo, exigiendo acción inmediata del equipo.

#### Día 14: Modernización de Arquitectura y Notificaciones Inteligentes
- **Hito:** Finalización de la Fase 6 con la implementación de historial, avisos sonoros y migración global a la tecnología más reciente de Angular.
- **Detalles técnicos:**
    - **Pestaña de Historial:** Expansión del `AdminComandaService` para incluir el estado `SERVIDO`. Creación de una vista dedicada para pedidos finalizados, permitiendo al staff auditar rondas entregadas. El historial se presenta invertido (FIFO inverso) para priorizar las comandas más recientes.
    - **Notificaciones con Web Audio API:** Integración de un sistema de avisos sonoros nativo. Se desarrolló un sintetizador de audio que utiliza osciladores para generar un sonido de "campanilla de servicio" (🛎️) optimizado en frecuencia (3500Hz). La lógica detecta cambios de tipo `added` en Firestore, evitando falsos positivos durante la carga inicial.
    - **Migración a Angular Control Flow (@if, @for):** Refactorización integral de todo el proyecto (B2C y B2B) eliminando las directivas estructurales `*ngIf` y `*ngFor` en favor de la nueva sintaxis nativa de Angular 17+. Esta mejora incrementa el rendimiento de renderizado y prepara el código para futuras optimizaciones de "hydration".
    - **Actualización de Normas de Desarrollo:** Inclusión de una regla estricta en `.antigravityrules` que prohíbe el uso de sintaxis heredada, asegurando la consistencia técnica del proyecto para su defensa ante tribunal.

---

### Fase 7: Vista de Cocina en Tiempo Real (KDS) (Completado)

#### Día 15: Tablero de Producción y Separación de Roles
- **Hito:** Implementación del Sistema de Visualización de Cocina (KDS) profesional con lógica de agregación y automatización de estados.
- **Detalles técnicos:**
    - **Workstation Isolation:** Creación de componentes dedicados (`VistaCocinaComponent` y `VistaBarraComponent`) que filtran la información según el puesto de trabajo, reduciendo el ruido visual para el personal.
    - **Modo de Producción Agregado:** Desarrollo de algoritmos de agrupación en `AdminComandaService` que suman cantidades de productos idénticos de diferentes mesas, permitiendo a cocina "marchar" varias raciones simultáneamente.
    - **Auto-Marchar Inteligente:** Implementación de lógica de cierre de ciclo. La comanda muta automáticamente a estado `LISTO` solo cuando todas sus líneas (tanto de barra como de cocina) han sido marcadas como preparadas.

#### Día 16: Arquitectura KDS y Sistema de Diseño Global (Completado)
- **Hito:** Implementación de la infraestructura de visualización de cocina (KDS) por roles y consolidación de un sistema de diseño institucional con persistencia de estado.
- **Detalles técnicos:**
    - **Aislamiento de Workstations:** Desarrollo de los componentes `VistaCocinaComponent` y `VistaBarraComponent`. Se ha implementado un patrón de filtrado reactivo basado en el atributo `destino` de la `LineaComanda`, asegurando que cada estación de trabajo reciba exclusivamente la información pertinente para su flujo operativo, minimizando así la latitud de error en el servicio.
    - **Design System Centralizado:** Migración de estilos ad-hoc a un sistema de tokens de diseño en `global.scss`. Se han definido variables CSS para la gestión semántica de colores (neón operacional) y estados (urgente, pendiente, completado).
    - **Persistencia de Preferencias (UserSettingsService):** Creación de una capa de servicio encargada de la serialización y recuperación de preferencias de usuario (ej. modo oscuro) mediante `localStorage`. Esto garantiza una experiencia de usuario consistente tras ciclos de recarga o reinicio de sesión.
    - **Refactorización Visual de Interfaz Cliente:** Aplicación de técnicas de *Glassmorphism* y micro-interacciones en los componentes de `Carta` y `SeguimientoComanda`. Se ha optimizado la jerarquía visual de los estados de pedido para mejorar la transparencia informativa hacia el comensal.

### Fase 8: Gestión de la Carta Avanzada (Backoffice) (Completado)

#### Día 17: Módulo de Gestión de Productos (CRUD Pro) (Completado)
- **Hito**: Evolución del catálogo a un sistema de productos complejo con variantes y modificadores.
- **Detalles técnicos**:
    - **Variantes de Producto**: Implementación de raciones (ej. Tapa, Media, Ración) con precios dinámicos vinculados a una única ficha de producto.
    - **Grupos de Modificadores**: Sistema de extras opcionales y selecciones excluyentes (ej. punto de la carne) con recálculo automático de precio en el carrito.
    - **Formulario Reactivo Dinámico**: Uso de `FormArray` y señales para gestionar colecciones de variantes y modificadores en el panel de administración.

#### Día 18: Motor de Turnos y Horarios Reactivos (Completado)
- **Hito**: Implementación de inteligencia temporal en la carta basada en la configuración de Firestore.
- **Detalles técnicos**:
    - **HorarioRestauranteService**: Escucha activa del documento `configuracion/general` para determinar el turno actual (Almuerzo/Cena).
    - **Filtrado Reactivo por Tiempo**: La `CartaService` ahora usa un `computed()` que depende del turno actual. Si el restaurante "cierra", los platos restringidos desaparecen de la carta del cliente al instante sin recargar la página.
    - **Ordenación Manual**: Incorporación del campo `orden` para que el administrador controle la prioridad visual de los platos.

#### Día 19: Centralización de Audio y UX (Completado)
- **Hito**: Creación del `AudioService` para feedback sonoro unificado mediante Web Audio API.
- **Detalles técnicos**:
    - **Síntesis de Audio**: Generación de sonidos (Ping de campana, Clic de éxito) mediante osciladores, eliminando la dependencia de archivos `.mp3` externos y mejorando el rendimiento.
    - **Integración Transversal**: Notificaciones sonoras en el panel B2B para pedidos nuevos y feedback táctil/sonoro en el B2C al añadir productos.
    - **Corrección de Tipos y Limpieza**: Normalización de interfaces (`ProductoMaquetado`) y eliminación de código muerto tras el refactorizado.

---
#### Día 19 (Parte 1): Generador QR y Exportación a PDF (Completado)
- **Hito**: Implementación de herramientas administrativas para la gestión física de mesas y auditoría financiera mediante exportación de datos.
- **Detalles técnicos**:
    - **Generador QR Dinámico**: Creación del `GeneradorQrComponent` que permite asignar números de mesa, generar URLs vinculadas y descargar/imprimir el código QR para su uso físico en el local.
    - **Exportación Z (PDF)**: Integración de las librerías `jspdf` y `jspdf-autotable`. Se ha desarrollado una lógica de exportación que transforma las señales de `MetricasService` (KPIs y Ranking) en un documento PDF profesional con formato de informe de cierre.
    - **UI Administrativa**: Adición de botones de acción con feedback visual (hover, active, disabled) y estados de carga para evitar exportaciones inconsistentes si no hay datos.

---

### Fase 9: Gestión de Stock y Auto-Sold-Out (Completado)

#### Día 20: Control de Inventario y Experiencia del Cliente
- **Hito**: Implementación de la lógica de stock en el panel B2B y su reflejo reactivo en el B2C.
- **Detalles técnicos**:
    - **Agotado Dinámico (Auto-Sold-Out)**: Integración del campo `stock` en `Producto`. Cuando un producto llega a 0 de stock, su propiedad `agotado` se activa dinámicamente en el `CartaComponent`.
    - **Feedback Visual**: Los productos agotados en la vista del cliente muestran un badge "AGOTADO" y se deshabilita el botón de añadir a la comanda, previniendo errores de sincronización y mejorando la satisfacción del comensal.

---

### Fase 10: Robustez, Seguridad y Resiliencia (Completado)

#### Día 21: Internacionalización y Estándares Empresariales
- **Hito**: Transformación de la aplicación en un producto Enterprise-Ready.
- **Detalles técnicos**:
    - **Traducciones Reactivas (i18n)**: Normalización final de todos los literales de la app usando `@ngx-translate/core`. Los pipes `currency` y `date` ahora son dinámicos y responden a los cambios de idioma (`es` vs `en`).
    - **Refinamiento de Copywriting**: Ajuste del tono de voz ("Table Billing", "Invoice") en los diccionarios JSON para lograr un carácter profesional.
    - **Limpieza de Control Flow**: Migración completa y exhaustiva a las directivas `@if` y `@for` de Angular 17.

#### Día 22: Seguridad Firestore y PWA
- **Hito**: Blindaje de la base de datos y mejoras de infraestructura de red.
- **Detalles técnicos**:
    - **Firestore Rules**: Desarrollo e implementación de `firestore.rules` garantizando que los clientes anónimos solo pueden leer/escribir comandas asociadas a su mesa (`idMesa`), mientras que los productos del menú son de solo lectura pública. El staff (con auth) tiene privilegios CRUD completos.
    - **Progressive Web App (PWA)**: Integración de `@angular/pwa` y Service Workers. La aplicación ahora soporta modo offline parcial, cacheo de recursos (CSS, JS, iconos) e instalación directa en dispositivos (iOS/Android), mitigando problemas en restaurantes con redes Wi-Fi inestables.
    - **Script de Migración**: Ejecución exitosa de `migrarProductosAntiguos()` para compatibilidad retroactiva de datos en Firestore (nombres y descripciones internacionales).

---
*Última actualización: 9 de mayo de 2026 - Proyecto completado al 100% (Fase Final)*
