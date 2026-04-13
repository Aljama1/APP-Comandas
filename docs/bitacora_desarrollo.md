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

### Fase 1: Identidad y Acceso del Comensal (En desarrollo)

#### Día 1: Interfaz de Bienvenida y Perfil de Usuario
- **Hito**: Implementación del esqueleto del `CheckInComponent` como pieza central de la entrada del cliente.
- **Detalles técnicos**:
    - **Enfoque Standalone**: Uso de componentes independientes para optimizar el bundle y facilitar el testing unitario futuro.
    - **Diseño UI/UX (Minimalist White)**: Implementación de un diseño limpio estilo Apple para reducir la carga cognitiva del cliente.
    - **Reactividad Base**: Integración de `FormsModule` para capturar el `Nombre` y `MesaID` mediante "Two-way data binding".
- **Decisión de Arquitectura**: Se optó por un diseño de "ruta limpia" (`/check-in`) como acceso único para el comensal tras el escaneo del código QR.

---
*Última actualización: 13 de abril de 2026*
