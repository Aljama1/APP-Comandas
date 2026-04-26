# Bitácora de Desarrollo - TFG Comandas y Alérgenos

Este documento registra los hitos y pasos clave en el desarrollo del proyecto.

## Visión del Proyecto (B2C)
Aplicación Híbrida orientada al **Cliente Final (Comensal)** para la autogestión de comandas en restaurantes, con un enfoque crítico en la **Accesibilidad Alimentaria y Filtro de Alérgenos**. El sistema cuenta con un panel administrativo (Web) para el restaurante, y una interfaz móvil amigable donde el cliente escanea su mesa y el catálogo se adapta a su perfil médico.

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

### Fase 4: Sincronización en Tiempo Real con Cocina (En curso)

#### Día 8: Conexión de la Comanda a la Nube (Firestore) (Completado)
- **Hito**: Integración del ecosistema Firebase para dotar a la aplicación de persistencia real y gestión de identidades.
- **Detalles técnicos**:
    - **Estrategia Híbrida de Auth**: Implementación de `signInAnonymously()` de Firebase Auth. Esta decisión de diseño garantiza una experiencia "Zero-Friction" para el comensal, eliminando la necesidad de registro previo pero dotando a cada pedido de un UID (Unique Identifier) para trazabilidad de seguridad.
    - **Persistencia en Firestore**: Desarrollo del `ComandaFirestoreService`. Tras la confirmación del usuario, se transforma el objeto reactivo (Signal) en un documento NoSQL persistente, desvinculando la lógica de presentación de la capa de datos.
    - **Refactorización de Interfaz de Envío**: Inclusión de estados de carga (`LoadingController`) y diálogos de confirmación asíncronos en el `ResumenComandaComponent` para mejorar el feedback visual durante la comunicación con el servidor.
    - **Internacionalización de Activos**: Normalización del set de iconos de alérgenos (`gluten.svg`, `lactosa.svg`, `frutos-secos.svg`) garantizando consistencia semántica en todo el proyecto.

---
*Última actualización: 26 de abril de 2026*
