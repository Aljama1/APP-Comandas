# Arquitectura del Proyecto: Trace (App Comandas)

Esta aplicación ha sido desarrollada siguiendo los estándares más recientes de **Angular (v18)** y **Ionic Framework**, priorizando el rendimiento, la escalabilidad y la experiencia de usuario (UX).

## 1. Patrón Standalone (Arquitectura sin Módulos)
A diferencia de las versiones antiguas de Angular que dependían de `NgModules`, este proyecto utiliza **Standalone Components**.
*   **Modularidad Total:** Cada componente gestiona sus propias dependencias, lo que facilita el mantenimiento.
*   **Lazy Loading Eficiente:** Los componentes se cargan bajo demanda a través del router, reduciendo el tiempo de carga inicial.
*   **Simplificación:** Eliminación de archivos innecesarios como `app.module.ts`, centralizando la configuración en `main.ts` y `app.routes.ts`.

## 2. Gestión de Estado con Angular Signals
Para la reactividad de la interfaz, se ha optado por **Signals** en lugar de depender exclusivamente de observables complejos.
*   **Rendimiento:** Angular solo actualiza las partes de la pantalla que realmente cambian, sin necesidad de comprobaciones globales pesadas.
*   **Sincronización:** Permite que datos como el carrito de compra o el estado de los pedidos se mantengan coherentes en toda la app de forma declarativa.

## 3. Integración Real-Time con Firebase
El "corazón" de la aplicación es la conexión con **Firebase Cloud Firestore**.
*   **Patrón Observer:** Se utilizan listeners (`onSnapshot`) que empujan los cambios desde la base de datos a la interfaz al instante.
*   **Seguridad:** Implementación de **Firebase Auth** para distinguir entre clientes anónimos y personal del staff autenticado.
*   **Protección de Rutas:** Uso de **Guards** funcionales para asegurar que solo el personal autorizado acceda al panel de gestión.

## 4. Stack Tecnológico Principal
| Tecnología | Función |
| :--- | :--- |
| **Angular 18** | Framework base de la aplicación. |
| **Ionic Angular** | Biblioteca de componentes UI para móviles y web. |
| **Firebase Firestore** | Base de datos NoSQL orientada a documentos en tiempo real. |
| **Capacitor** | Bridge para convertir la web app en una aplicación nativa (iOS/Android). |
| **TypeScript** | Lenguaje de tipado fuerte para un código más robusto. |

## 6. Sistema de Diseño (Design System)
La aplicación implementa un lenguaje visual unificado diseñado para entornos de alta operatividad:
*   **Tematización Dinámica:** Uso de variables CSS nativas para el soporte completo de modos claro y oscuro, optimizando la legibilidad en diferentes condiciones de iluminación (ej. Cocinas o terrazas).
*   **Arquitectura de Estilos:** Empleo de metodologías modernas en SCSS para la creación de componentes con efectos de *Glassmorphism* (cristal esmerilado) y micro-interacciones que mejoran el feedback táctil.
*   **Tokens de Diseño:** Centralización de colores corporativos y estados operativos (neón operacional) para garantizar la consistencia en todas las interfaces del staff.

## 7. Persistencia y Preferencias de Usuario
Para mejorar la experiencia de usuario y la resiliencia de la aplicación:
*   **UserSettingsService:** Capa de abstracción que gestiona el estado de configuración (tema, idioma, preferencias de filtrado) vinculando los *Angular Signals* con el almacenamiento persistente del navegador (`localStorage`).
*   **Continuidad de Sesión:** El sistema es capaz de restaurar el estado completo de la mesa, el carrito y las preferencias estéticas tras una interrupción de la red o recarga del navegador.

---
> [!NOTE]
> Esta arquitectura ha sido seleccionada por su baja deuda técnica y por alinearse con las recomendaciones actuales de Google para aplicaciones web progresivas (PWA) de alto rendimiento.
