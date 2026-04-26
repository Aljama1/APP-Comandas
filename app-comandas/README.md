# Trace App (Proyecto TFG)

Bienvenido al repositorio de **Trace**, una aplicación móvil desarrollada para mejorar la experiencia de usuario en restaurantes, centrándose especialmente en el **filtrado dinámico de alérgenos** desde la perspectiva del cliente (B2C).

Este proyecto está construido de forma robusta con **Ionic**, **Angular**, y soportado por **Firebase**, aplicando principios de Clean Architecture y UI/UX moderna (Glassmorphism, transiciones fluidas, tipografía geométrica, y paletas de colores oscuras "premium").

---

## 📱 Previsualización en el Teléfono Móvil (Red Local)

Si quieres testear el diseño y la usabilidad de la aplicación en un dispositivo telefónico real sin necesidad de generar ejecutables (.apk), puedes levantar un servidor en tu red local.

**Pasos a seguir:**

1. Asegúrate de que tanto tu PC (donde corre el entorno de desarrollo) como tu teléfono móvil están conectados a la **misma red Wi-Fi**.
2. Abre la terminal de comandos de tu IDE (ej: VS Code) en la ruta raíz del proyecto (`app-comandas`).
3. Ejecuta el entorno permitiendo el acceso externo con el siguiente comando:
   ```bash
   npx ionic serve --external
   ```
4. En la terminal se mostrará una dirección de **External**. Suele tener el formato `http://[TU-IP-LOCAL]:8100` (por ejemplo: `http://192.168.1.55:8100`).
5. Escribe esa URL en el **navegador de tu teléfono inteligente** y verás la aplicación a pantalla completa tal como quedaría programada en formato móvil real.

> **Tip para Live-Reload:** Si dejas este comando corriendo mientras desarrollas, cualquier cambio que guardes en el código en tu ordenador, actualizará la app instantáneamente en la pantalla de tu móvil.

---

## 💻 Entorno de Desarrollo (Instalación y Configuración)

### Requisitos Previos

Antes de comenzar, necesitarás instalar en tu máquina corporativa o de desarrollo las siguientes herramientas:

- **Node.js** (v18.x o superior recomendado).
- **NPM** (Instalador de paquetes de Node).
- **Ionic CLI** (Instalable vía `npm install -g @ionic/cli`).

### Instalación de dependencias

1. Clona o descarga el repositorio y navega hasta la carpeta raíz del proyecto frontend (`app-comandas`).
2. Instala las dependencias declaradas en el `package.json`:
   ```bash
   npm install
   ```

### Ejecutar sólo en el navegador del PC

Para trabajar en el entorno de escritorio probando el aplicativo desde los DevTools de tu navegador:

```bash
npx ionic serve
```
Y accede a `http://localhost:8100`.

---

## 🛠 Compilación de la Aplicación (Build)

Para generar una build de producción limpia y minificada del código para el despliegue de las apps web y móviles:

```bash
npm run build
```

Esto generará la carpeta `www/` con el código estático compilado y optimizado. Para convertir esto en archivos instalables como `.apk` de Android, se utilizan comandos del motor Capacitor:

```bash
npx cap sync android
npx cap open android
```

---

## 📐 Estructura del Código
El proyecto sigue convenciones estrictas de separación de lógica, mantenibilidad y componentes reusables basados en las directrices de Angular:
- **`src/app/core/`**: Servicios base y guards.
- **`src/app/features/`**: Módulos independientes correspondientes a cada "página/flujo" principal. (Ej: Check-in, Carta con filtrado de alérgenos).
- **`src/app/shared/`**: Componentes globales reutilizables.
- **`src/assets/`**: Estilos CSS fundamentales, tipografías globales y mockups de prueba estáticos.
