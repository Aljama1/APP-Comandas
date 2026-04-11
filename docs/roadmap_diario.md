# Roadmap de Desarrollo: Planificación Diaria

Este documento detalla el plan de acción secuencial (día por día de desarrollo efectivo) para construir la aplicación B2C de Autogestión de Comandas. Cada paso se ha diseñado siguiendo criterios académicos, promoviendo la resiliencia del software y manteniendo los estándares de Clean Architecture.

---

## Fase 1: Identidad y Acceso del Comensal

### Día 1: Pantalla de "Check-in" y Perfil Médico (Inicio)
- **Propuesta:** Diseñar y programar el componente Standalone de Bienvenida (`features/autenticacion`). El cliente introducirá su nombre, seleccionará sus alergias activas mediante seleccionadores visuales y tecleará (o escaneará) el ID de su mesa.
- **Por qué:** Antes de mostrar cualquier tipo de catálogo alimenticio, el sistema NECESITA conocer el perfil médico del usuario. Esto garantiza que la promesa transversal del TFG (la seguridad alimentaria) condicione el resto de la aplicación desde el primer segundo.

### Día 2: Vinculación del Estado Global
- **Propuesta:** Implementar el paradigma de reactividad nativa (Angular Signals) dentro de `core/services/` para guardar en la memoria temporal del móvil la identidad del cliente y sus restricciones alimentarias durante toda la sesión.
- **Por qué:** Usar Signals (principal innovación de Angular 20) en lugar de consultar intermitentemente a la base de datos ahorra peticiones de red, mejora el rendimiento drásticamente y demuestra al tribunal dominio de las tecnologías de último nivel.

---

## Fase 2: El Menú Digital Inteligente

### Día 3: Maquetación de la Carta Base
- **Propuesta:** Desarrollar el componente visual de la carta (`features/carta`). Crear una lista asíncrona con imágenes, títulos y descripciones cortas simulando datos locales temporales (Mock Data) de productos.
- **Por qué:** Separar el desarrollo puramente visual (HTML/SCSS apoyado en Ionic) de la lógica matemática compleja nos permite asegurar que la aplicación es perfectamente "responsiva" antes de introducir cálculos pesados.

### Día 4: Motor Central de Filtrado de Alérgenos
- **Propuesta:** Inyectar el Servicio de Usuario en la vista de la Carta. Programar un algoritmo interceptor que cruce el vector de `alergenos` de cada Producto con el vector de `alergiasActivas` del inviduo, bloqueando botones de interacción o difuminando los elementos letales.
- **Por qué:** Constituye el núcleo algorítmico del TFG. Desarrollarlo de forma aislada asegura que la validación lógica es sólida, fácilmente testable e inderogable desde la interfaz gráfica.

---

## Fase 3: Autogestión del Carrito de la Comanda

### Día 5: Lógica del Carrito Flotante
- **Propuesta:** Construir el `OrderService` y un componente constante adjunto (ej. bandeja inferior) que tabule centralizadamente las variables `LineaPedido`.
- **Por qué:** Centralizar el carrito en un Singleton (Servicio) evita inconsistencias de datos y posibles desbordamientos de memoria cuando el usuario modifique masivamente su pedido navegando entre pestañas (Primeros, Postres, etc.).

### Día 6: Pantalla de Resumen y Confirmación 
- **Propuesta:** Desarrollar `features/comandas` donde el cliente evalúa el desglose de su pedido, puede adjuntar notas a cocina especiales, verifica el cálculo de subtotales y rubrica la orden.
- **Por qué:** Representa la culminación funcional del flujo comercial (B2C). Demanda un diseño libre de fricciones de usabilidad (UX) para prevenir abandonos y errores por parte del comensal.

---

## Fase 4: Sincronización en Tiempo Real con Cocina

### Día 7: Conexión de la Comanda a la Nube (Firestore)
- **Propuesta:** Implementar AngularFire. Tras la firma del cliente, transformar la abstracción local de la clase `Comanda` en un Payload y emitirlo a una colección securizada en el bucket de Firestore.
- **Por qué:** Ejecutar la persistencia separadamente blinda la aplicación, pues si ocurre un fallo transversal de conexión, el carrito local puede mantenerse íntegro en la memoria del dispositivo y retentarse más tarde.

### Día 8: Interfaz Receptora de Cocina (Tablet)
- **Propuesta:** Desarrollar un sistema de escucha activa (`valueChanges`) para que el equipo de preparación reciba actualizaciones en vivo de nuevas comandas o cambios de estado, sin recargas de ventana.
- **Por qué:** Las bases de datos NoSQL basadas en websockets están diseñadas específicamente para proveer arquitectura orientada a eventos. Evidenciarlo con un sistema "Push" síncrono suma infinito valor técnico frente al clásico sistema "Pull" de peticiones convencionales.

---

## Fase 5: Panel Administrativo Web (Back-office)

### Día 9: Mantenimiento (CRUD) del Restaurador
- **Propuesta:** Habilitar un subdominio administrativo (gestión web) que faculte al propietario la alteración del catálogo, imposición de precios y declaración estricta de trazas/alérgenos aplicables sobre cada nuevo plato.
- **Por qué:** Asegura la autonomía completa del Software. Sin un Back-office funcional embebido, el producto carece de valor comercial al depender el hostelero de administradores de bases de datos.

### Día 10: Generación Lógica de Identificadores Físicos
- **Propuesta:** El administrador inyectará "Mesas" y la aplicación compilará automáticamente Hashes o URL canónicas con las que asociar digitalmente el Código QR físico situado en el establecimiento.
- **Por qué:** Establece la trazabilidad de seguridad y un diseño técnico "End-to-End" absoluto, hilvanando el plano material (etiqueta física de una mesa) con su entidad virtual.

---

## Fase 6: Auditoría, Detalles Nativo y Entrega

### Día 11: Feedback Táctil y Resoluciones
- **Propuesta:** Acceder a la integración de Capacitor (`@capacitor/haptics`) invocando el hardware del teléfono para producir vibraciones concretas al añadir ítems peligrosos y configurar notificaciones in-app.
- **Por qué:** Demuestra un entendimiento holístico de la capacidad híbrida de Ionic, rebasando el límite de un "simple sitio web", para consolidar un producto que emana sensaciones nativas.

### Día 12 y 13: Reglas de Seguridad y Cierres
- **Propuesta:** Perfilar rigurosamente la colección de Firebase limitando las políticas de Lectura/Escritura y efectuar subidas de testing final a Firebase Hosting para obtener enlaces web distribuidos.
- **Por qué:** Proporciona rigurosidad legal y técnica sobre el dato en entornos de cloud pública, protegiendo las órdenes privadas de los clientes y coronando exitosamente el TFG.
