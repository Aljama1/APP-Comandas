> ⚠️ **Documento histórico — no vigente.**
> Este análisis corresponde al **estado inicial del repositorio en enero de 2026** (Fase 0, antes de la implementación). Se conserva por valor historiográfico y para evidenciar la evolución del proyecto, pero **no debe utilizarse como referencia técnica vigente**: la arquitectura, el stack y los módulos descritos aquí han sido superados por las Fases 1–11.
>
> Para la documentación técnica actual, consultar:
> - [`arquitectura_proyecto.md`](../arquitectura_proyecto.md) — arquitectura vigente.
> - [`backend_firebase.md`](../backend_firebase.md) — modelo de datos y reglas de seguridad.
> - [`bitacora_desarrollo.md`](../bitacora_desarrollo.md) — historial completo de hitos.

---

# Análisis Arquitectónico y Estado del Proyecto (Fase 0)

Como Arquitecto de Software y Documentador Técnico, he analizado el repositorio de la **App de Comandas**. Dado que el proyecto ha sido recién inicializado, este documento refleja su estado base, identificando el stack, evaluando las primeras decisiones de arquitectura y proporcionando una hoja de ruta para evitar deuda técnica temprana.

---

## 1. Resumen Tecnológico (Stack)

El proyecto se sustenta en un stack moderno de última generación, ideal para una aplicación híbrida web/móvil multiplataforma y reactiva:

*   **Framework Principal:** Angular 20 (`@angular/core: ^20.0.0`).
*   **Framework UI:** Ionic 8 (`@ionic/angular: ^8.0.0`).
*   **Integración Nativa (Hardware/SO):** Capacitor 8 (`@capacitor/core: 8.3.0`).
*   **Backend & Tiempo Real:** Firebase (`@angular/fire: ^20.0.1` ya instalado, pero pendiente de inicialización en front-end).
*   **Lenguaje:** TypeScript 5.9.
*   **Estilos:** SCSS.

> **Conclusión del Stack:** Es una elección robusta y de vanguardia para un TFG en 2026. Angular 20 + Ionic 8 garantiza rendimiento y modernidad.

---

## 2. Arquitectura de la App

**Estado actual:**
La organización de carpetas es la estructura por defecto que provee el Ionic CLI (`src/app/home`). 
Se ha detectado un **patrón híbrido de componentes**: se están introduciendo Componentes Autocontenidos (*Standalone Components*, por ejemplo en el decorador de `app.component.ts` y `home.page.ts` empleando `standalone: true` e `imports: [...]`), pero el proyecto todavía conserva archivos de Módulos clásicos (`app.module.ts`, `home.module.ts`).

**Sugerencia Arquitectónica a implementar:**
Para garantizar la escalabilidad e implementando principios de *Clean Architecture*, el proyecto debe migrar a un enfoque **100% Standalone** y adoptar la siguiente estructura de carpetas sugerida:

```text
src/app/
 ├── core/          # (Servicios Singleton, Guards, Interceptors, Config Firebase)
 ├── shared/        # (Componentes UI reutilizables genéricos, Pipes, Directivas)
 ├── features/      # (Módulos de negocio agrupados por dominio)
 │    ├── autenticacion/ # Login, Registro de Administrador o Cliente
 │    ├── mesas/         # Mapa de mesas, Generador de QRs
 │    ├── carta/         # Catálogo digital con interfaz hiper-amigable y alerta de alérgenos
 │    └── comandas/      # Creación de comandas B2C (Autogestión), Carrito, Estados de envío
```

---

## 3. Flujo de Datos del Negocio (Enfoque B2C)

**Estado actual:**
Aún no hay lógica implementada. El archivo `app.routes.ts` simplemente carga dinámicamente la ruta `inicio` que apunta al componente base.

**Flujo de Datos Planificado (Recomendado):**
Basado en los objetivos del negocio (App de Autogestión de Comandas orientada al Cliente Final "B2C"), el ciclo de vida de los datos debería gestionarse así:
1. **Inputs de Interfaz:** El cliente escanea el QR de la mesa, se loguea (o entra como invitado) y configura su perfil médico/alergias.
2. **Gestión de Estado (Signals):** El estado local temporal del pedido ("carrito") se filtra en tiempo real adaptando la vista para ocultar/advertir alimentos letales usando **Angular Signals**.
3. **Capa de Servicios:** El Servicio de Comandas (`OrderService`) valida la lógica del carrito autogestionado por el cliente y lo despacha a la API.
4. **Capa de Datos (Firebase):** Envío del documento de la Comanda a un bucket/colección en *Firestore*.
5. **Reacción Externa:** Al ser en tiempo real, el módulo de recepción (Tablet en Cocina/Barra) suscrito a la misma colección de Firestore recibe el push instantáneo.

---

## 4. Estado de los Módulos

Al estar en las **fases iniciales del Setup**, el progreso lógico es el siguiente:

*    **Completados y Listos:** Configuración del entorno base, instalación de dependencias estructurales, CLI. Modificaciones semánticas iniciales en componente Home y main app routing.
*    **En Progreso (A medias):**
    *   **Limpieza de Arquitectura:** Migración completa a *Standalone*.
    *   **Enlace Backend:** La dependencia de Firebase existe, falta conectar las credenciales de entorno en Angular.
*    **Componentes Críticos Faltantes (Backlog):**
    *   Sistema de Autenticación y Autorización (Roles: Administrador / Gestor y Cliente Final).
    *   Arquitectura / Modelos de Base de Datos (Interfaces TypeScript).
    *   Generador de IDs de Mesas/QR y Módulo Gestor.
    *   Menú Digital Inteligente y Sistema Adaptativo de Control de Alérgenos.
    *   Módulo CRUD del carrito de Comandas para los clientes.

---

## 5. Análisis de Base de Datos

**Situación actual:**
No se han definido Modelos/Interfaces de TypeScript ni existen esquemas definidos en la carpeta del repositorio local. El SDK de Firebase de lado del cliente está presente pero la inicialización de la app no se ha agregado al inicio rápido.

**Esquema Relacional Recomendado (NoSQL Firestore):**
Dado que Firestore es NoSQL orientado a Documentos, sugiero empezar modelando (en `src/app/core/models/`) lo siguiente:

*   **Users (Cuentas B2C y Administradores):** `{ id, nombre, email, rol, array_alergias_activas }`
*   **Tables (Mesas Vinculadas):** `{ id, numero, tokenQR, ocupada_por_cliente_id }`
*   **Products (Carta):** `{ id, nombre, precio, categoria, alergenos_peligrosos (array[string]), foto, descripcion }`
*   **Orders (Comandas B2C):**
    `{ id, mesa_id, cliente_id, lineasPedido: [{ producto_id, cantidad, variaciones, subtotal }], estado (pendiente/preparando/servido), timestamp_creacion, precio_total }`

