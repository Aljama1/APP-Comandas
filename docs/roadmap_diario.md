# Roadmap de Desarrollo: Planificación por Fases

Este documento detalla el plan de acción completo para construir **Trace**, un sistema integral de gestión de comandas con accesibilidad alimentaria. El proyecto abarca dos verticales:

- **B2C (Cliente Final):** El comensal escanea el QR de su mesa, configura su perfil de alérgenos, consulta la carta filtrada, monta su pedido y realiza el seguimiento en tiempo real desde su móvil.
- **B2B (Staff del Restaurante):** Los trabajadores del bar/restaurante reciben, gestionan y despachan los pedidos desde un panel de administración, con separación inteligente entre **Barra** (bebidas) y **Cocina** (comidas).

Cada fase se ha diseñado siguiendo criterios académicos, promoviendo la resiliencia del software y manteniendo los estándares de Clean Architecture.

---

## Resumen del Estado Actual (29 de abril de 2026)

| Fase | Nombre | Estado |
|------|--------|--------|
| 1 | Identidad y Acceso del Comensal | ✅ Completada |
| 2 | El Menú Digital Inteligente | ✅ Completada |
| 3 | Autogestión del Carrito de la Comanda | ✅ Completada |
| 4 | Sincronización en Tiempo Real con la Nube | ✅ Completada |
| 5 | Modelo de Destinos y Comandas Múltiples | 🔜 Pendiente |
| 6 | Panel de Administración B2B (Barra) | 🔜 Pendiente |
| 7 | Vista de Cocina en Tiempo Real | 🔜 Pendiente |
| 8 | Auditoría, Seguridad y Entrega Final | 🔜 Pendiente |

---

## Fase 1: Identidad y Acceso del Comensal ✅

### Día 1: Pantalla de "Check-in" y Perfil Médico
- **Propuesta:** Diseñar y programar el componente Standalone de Bienvenida (`features/autenticacion`). El cliente introducirá su nombre, seleccionará sus alergias activas mediante seleccionadores visuales y tecleará (o escaneará) el ID de su mesa.
- **Por qué:** Antes de mostrar cualquier tipo de catálogo alimenticio, el sistema NECESITA conocer el perfil médico del usuario. Esto garantiza que la promesa transversal del TFG (la seguridad alimentaria) condicione el resto de la aplicación desde el primer segundo.
- **Artefactos:** `CheckInComponent`, interfaz `PerfilUsuario`, iconos SVG de alérgenos.

### Día 2: Vinculación del Estado Global
- **Propuesta:** Implementar el paradigma de reactividad nativa (Angular Signals) dentro de `core/services/` para guardar en la memoria temporal del móvil la identidad del cliente y sus restricciones alimentarias durante toda la sesión.
- **Por qué:** Usar Signals (innovación principal de Angular 20) en lugar de consultar intermitentemente a la base de datos ahorra peticiones de red, mejora el rendimiento drásticamente y demuestra al tribunal dominio de las tecnologías de último nivel.
- **Artefactos:** `UsuarioService` con `signal()`, `computed()` y persistencia en `localStorage`.

---

## Fase 2: El Menú Digital Inteligente ✅

### Día 3: Maquetación de la Carta Base
- **Propuesta:** Desarrollar el componente visual de la carta (`features/carta`). Crear una lista asíncrona con imágenes, títulos y descripciones cortas simulando datos locales temporales (Mock Data) de productos.
- **Por qué:** Separar el desarrollo puramente visual (HTML/SCSS apoyado en Ionic) de la lógica matemática compleja nos permite asegurar que la aplicación es perfectamente "responsiva" antes de introducir cálculos pesados.
- **Artefactos:** `CartaComponent`, interfaz `Producto`, `CartaService` con Mock Data.

### Día 4: Motor Central de Filtrado de Alérgenos
- **Propuesta:** Inyectar el Servicio de Usuario en la vista de la Carta. Programar un algoritmo interceptor que cruce el vector de `alergenos` de cada Producto con el vector de `alergiasActivas` del individuo, bloqueando botones de interacción o difuminando los elementos letales.
- **Por qué:** Constituye el núcleo algorítmico del TFG. Desarrollarlo de forma aislada asegura que la validación lógica es sólida, fácilmente testable e inderogable desde la interfaz gráfica.
- **Artefactos:** `computed()` cruzado entre `UsuarioService` y `CartaService`, UI con bloqueo visual (grayscale + overlay).

---

## Fase 3: Autogestión del Carrito de la Comanda ✅

### Día 5: Lógica del Carrito Flotante
- **Propuesta:** Construir el `ComandaService` y un componente constante adjunto (píldora flotante inferior) que tabule centralizadamente las variables `LineaComanda`.
- **Por qué:** Centralizar el carrito en un Singleton (Servicio) evita inconsistencias de datos y posibles desbordamientos de memoria cuando el usuario modifique masivamente su pedido navegando entre categorías.
- **Artefactos:** `ComandaService` reactivo, `ResumenFlotanteComponent` con glassmorphism.

### Día 6: Pantalla de Resumen y Confirmación
- **Propuesta:** Desarrollar `features/comandas/resumen-comanda` donde el cliente evalúa el desglose de su pedido, puede adjuntar notas a cocina especiales, verifica el cálculo de subtotales y rubrica la orden.
- **Por qué:** Representa la culminación funcional del flujo comercial (B2C). Demanda un diseño libre de fricciones de usabilidad (UX) para prevenir abandonos y errores por parte del comensal.
- **Artefactos:** `ResumenComandaComponent` con stepper de cantidades, `AlertController` para notas a cocina.

### Día 7: Mejoras de UX, Organización y Accesibilidad
- **Propuesta:** Refinar la interfaz tras validar el flujo completo: agrupación por categorías, feedback visual al añadir, atributos ARIA exhaustivos, locale español, botón de logout con confirmación.
- **Por qué:** Asegurar que la app es usable y accesible antes de conectarla al backend.
- **Artefactos:** `productosPorCategoria` (computed), señal `productoRecienAnadido`, `registerLocaleData(localeEs)`.

---

## Fase 4: Sincronización en Tiempo Real con la Nube ✅

### Día 8: Conexión de la Comanda a Firestore
- **Propuesta:** Implementar AngularFire. Tras la confirmación del cliente, transformar la abstracción local de la clase `Comanda` en un documento y emitirlo a la colección `comandas` de Firestore. Autenticación anónima (`signInAnonymously`) para obtener un UID de trazabilidad sin fricción.
- **Por qué:** Ejecutar la persistencia separadamente blinda la aplicación, pues si ocurre un fallo de conexión, el carrito local se mantiene íntegro en la memoria del dispositivo. La autenticación anónima permite el modelo "Zero-Friction" del TFG.
- **Artefactos:** `ComandaFirestoreService` (envío), Auth Anónima en `CheckInComponent`, `LoadingController`.

### Día 8 (cont.): Robustez y Experiencia de Usuario
- **Propuesta:** Persistencia de sesión con `localStorage` (perfil + carrito sobreviven a F5), auto-llenado de mesa por QR (`?mesa=X`), redirección inteligente si ya existe sesión.
- **Artefactos:** Lectura de `queryParams`, lógica en constructores de servicios.

### Día 9: Seguimiento de Comanda en Tiempo Real (App Cliente)
- **Propuesta:** Implementar escucha activa (`onSnapshot`) en `ComandaFirestoreService` para que el comensal vea el progreso de su pedido (stepper visual) sin necesidad de refrescar la pantalla. Cada cambio de estado que realice el staff en Firestore se refleja instantáneamente en el móvil del cliente.
- **Por qué:** La base de datos NoSQL en tiempo real de Firestore permite una arquitectura orientada a eventos "Push" sin polling. Esto demuestra al tribunal dominio de los patrones Observer y programación reactiva.
- **Artefactos:** `SeguimientoComandaComponent` (stepper visual con estados: Recibida → En Preparación → Lista → Servida), Signals reactivos (`estadoComandaActiva`, `datosComandaActiva`, `errorEscucha`), ruta `/seguimiento-comanda`.

---

## Fase 5: Modelo de Destinos y Comandas Múltiples 🔜

> **Cambio de Alcance Técnico:** Esta fase introduce la separación inteligente del pedido por destino, un concepto clave para reflejar la logística real de un restaurante: las bebidas se resuelven en Barra y las comidas se despachan a Cocina.

### Día 10: Ampliación del Modelo de Datos

- **Propuesta:** Evolucionar las interfaces TypeScript para soportar el nuevo flujo:
  1. **`DestinoReceptor`**: Nuevo enumerado `'BARRA' | 'COCINA'` que se asigna automáticamente a cada línea de la comanda según la categoría del producto (si `idCategoria === 'bebidas'` → `BARRA`, todo lo demás → `COCINA`).
  2. **`LineaComanda`**: Añadir el campo `destino: DestinoReceptor` para que cada línea del pedido lleve su etiqueta de despacho.
  3. **Comandas múltiples por mesa**: El sistema actual ya crea un documento nuevo en Firestore por cada envío. Se elimina la restricción de "una comanda activa por sesión" para que una mesa pueda enviar tantas rondas como desee. El seguimiento mostrará la comanda más reciente y un historial.
- **Por qué:** Esta separación NO cambia el objetivo del TFG (autogestión de comandas con accesibilidad alimentaria), sino que lo **profesionaliza** y demuestra comprensión de la logística real hostelera. En la memoria se defenderá como "Optimización de flujos de trabajo por destino de producción".
- **Artefactos a modificar:** `producto.interface.ts`, `comanda.interface.ts`, `comanda.service.ts`, `comanda-firestore.service.ts`.

---

## Fase 6: Panel de Administración B2B — Barra/Caja 🔜

> **Destinatario:** Trabajadores del bar o restaurante. Se accede desde un PC o tablet en la barra.

### Día 11: Infraestructura de Autenticación del Staff

- **Propuesta:** Implementar un sistema de login para el personal del restaurante mediante Firebase Auth con Email/Contraseña (ya configurado en el proyecto). Crear una guarda de ruta (`AuthGuard`) que proteja las rutas `/admin/*` y redirija a un formulario de acceso si no hay sesión de staff activa.
- **Por qué:** El panel de administración NO puede ser accesible por los comensales. La separación de roles (B2C con Auth Anónima vs B2B con Auth Email) es una decisión de seguridad fundamental.
- **Artefactos:** `LoginAdminComponent` (ruta `/admin/login`), `AuthGuard`, `AdminAuthService`.

### Día 12: Panel de Pedidos Entrantes (Vista General de Barra)

- **Propuesta:** Desarrollar la vista principal del panel B2B (`features/admin/panel-pedidos`). El trabajador de barra verá en tiempo real (mediante `onSnapshot` sobre la colección `comandas`) todas las comandas con estado `PENDIENTE`. Cada tarjeta mostrará: mesa, nombre del cliente, listado completo (bebidas + comida), hora de entrada y un botón de "Aceptar Pedido".
- **Flujo al aceptar un pedido:**
  1. Las líneas con destino `BARRA` quedan visibles para el propio trabajador o su compañero, quien las prepara inmediatamente.
  2. Las líneas con destino `COCINA` se "despachan" automáticamente: el estado de la comanda cambia a `PREPARANDO` en Firestore, lo que dispara la actualización en la vista de cocina (Fase 7) y en el móvil del cliente (seguimiento).
- **Por qué:** Centralizar la aceptación de pedidos en un único punto (Barra) evita que la cocina reciba pedidos no validados por el staff. El trabajador actúa como "filtro humano".
- **Artefactos:** `PanelPedidosComponent`, `AdminComandaService` (lectura en tiempo real + actualización de estados).

### Día 13: Historial y Estados Avanzados

- **Propuesta:** Añadir al panel la capacidad de ver comandas en otros estados (En Preparación, Listas, Servidas) organizadas por mesa. Incluir un botón de "Marcar como Servida" para cerrar el ciclo. Implementar filtros por mesa, por estado y por hora.
- **Por qué:** El panel no solo recibe pedidos, también necesita dar visibilidad del estado global del servicio al encargado.
- **Artefactos:** Filtros y agrupaciones, transiciones de estado (`PREPARANDO → LISTO → SERVIDO`).

---

## Fase 7: Vista de Cocina en Tiempo Real 🔜

> **Destinatario:** Equipo de cocina. Se accede desde una tablet colgada en la cocina.

### Día 14: Tablero de Producción (Solo Comidas)

- **Propuesta:** Desarrollar una vista simplificada y de alto contraste (`features/admin/vista-cocina`) optimizada para lectura rápida en un entorno de cocina. Esta pantalla escucha en tiempo real la colección `comandas` filtrando SOLO las líneas con `destino === 'COCINA'` y estado `PREPARANDO`.
- **Formato visual:** Tarjetas grandes tipo Kanban o tickets de cocina, mostrando para cada comanda: número de mesa, lista de platos (sin bebidas), notas especiales del cliente, y hora de entrada.
- **Acción disponible:** Botón "Marchar" que cambia el estado de la comanda a `LISTO`, lo que notifica instantáneamente al panel de Barra (Fase 6) y al móvil del cliente (Fase 4).
- **Por qué:** La cocina NO necesita ver bebidas ni gestionar pedidos — solo necesita saber QUÉ cocinar y en QUÉ orden. Una interfaz sobrecargada de información en un entorno rápido y caliente es contraproducente.
- **Artefactos:** `VistaCocinaComponent`, ruta `/admin/cocina`, filtro computed por `destino`.

### Día 15: Notificaciones Sonoras y Priorización

- **Propuesta:** Añadir alertas sonoras al recibir un nuevo ticket de cocina, y un sistema de priorización visual (bordes de color o iconos) para pedidos que llevan demasiado tiempo en cola.
- **Por qué:** En un entorno de cocina real, la interacción visual pura no es suficiente; el sonido garantiza que ningún pedido pase desapercibido aunque nadie esté mirando la pantalla.
- **Artefactos:** `Audio API`, lógica de timestamps para alertas de antigüedad.

---

## Fase 8: Auditoría, Seguridad y Entrega Final 🔜

### Día 16: Reglas de Seguridad de Firebase

- **Propuesta:** Perfilar rigurosamente las reglas de Firestore:
  - **Clientes (Auth Anónima):** Solo pueden **crear** documentos en `comandas` con su propio UID. No pueden leer otras comandas ni modificar estados.
  - **Staff (Auth Email):** Pueden **leer** todas las comandas y **actualizar** el campo `estado`. No pueden eliminar documentos.
- **Por qué:** Proporciona rigurosidad legal y técnica sobre el dato en entornos de cloud pública, protegiendo las órdenes privadas de los clientes.
- **Artefactos:** Archivo `firestore.rules` desplegado.

### Día 17: Refactorización Final y Nomenclatura

- **Propuesta:** Auditoría completa del código asegurando:
  - 100% de la nomenclatura propia en español (`camelCase` para variables, `PascalCase` para clases, `kebab-case` para archivos y clases CSS).
  - Comentarios estratégicos que expliquen el *por qué*, no el *qué*.
  - Eliminación de código muerto, `console.log` de desarrollo y archivos sin usar.
- **Artefactos:** Revisión transversal de todos los archivos `.ts`, `.html`, `.scss`.

### Día 18: Despliegue y Documentación de Entrega

- **Propuesta:** Desplegar la aplicación en Firebase Hosting para obtener una URL pública demostrable. Actualizar la `bitacora_desarrollo.md` con todas las fases completadas. Preparar la demo funcional para el tribunal: un flujo completo desde el QR de la mesa hasta el ticket de cocina.
- **Por qué:** El tribunal necesita ver el sistema funcionando de extremo a extremo, no solo diapositivas.
- **Artefactos:** URL de Firebase Hosting, bitácora finalizada, guión de demostración.

---

## Diagrama del Flujo Completo (End-to-End)

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Móvil / B2C)                        │
│                                                                      │
│  QR Mesa → Check-in → Perfil Alérgenos → Carta Filtrada → Carrito   │
│         → Resumen → Confirmar Envío → Seguimiento en Tiempo Real    │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ Firestore (colección 'comandas')
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   BARRA / CAJA (PC o Tablet / B2B)                   │
│                                                                      │
│  Login Staff → Panel Pedidos Entrantes (PENDIENTE)                   │
│         → Aceptar Pedido:                                            │
│              • Líneas BARRA → Se preparan en el acto                 │
│              • Líneas COCINA → Estado pasa a PREPARANDO              │
│         → Vista de estados (Preparando, Listo, Servido)              │
└──────────────────────┬───────────────────────────────────────────────┘
                       │ Firestore (estado: PREPARANDO)
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   COCINA (Tablet colgada / B2B)                      │
│                                                                      │
│  Solo ve líneas con destino COCINA                                   │
│         → Tarjetas tipo ticket: Mesa, Platos, Notas                  │
│         → Botón "Marchar" → Estado pasa a LISTO                      │
│              → Notifica a Barra y al Móvil del Cliente               │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Reglas de Nomenclatura (Recordatorio Transversal)

Aplicables a **todo el código** en todas las fases:

| Contexto | Convención | Ejemplo correcto | Ejemplo incorrecto |
|---|---|---|---|
| Variables y funciones (TS) | `camelCase` en español | `productoSeleccionado` | `selectedProduct` |
| Clases e interfaces (TS) | `PascalCase` en español | `LineaComanda` | `OrderLine` |
| Archivos y rutas (Angular) | `kebab-case` en español | `resumen-comanda.component.ts` | `orderSummary.component.ts` |
| Clases CSS / Variables SCSS | `kebab-case` en español | `.tarjeta-producto`, `$color-fondo` | `.product-card`, `$bg-color` |
| Excepción obligatoria | Solo inglés para APIs de Angular, Ionic, CSS nativo | `@Component`, `ngOnInit`, `justify-content` | — |

---
*Última actualización: 29 de abril de 2026*
