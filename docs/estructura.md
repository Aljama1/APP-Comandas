src/app/
│
├── ⚙️ core/               (El "Cerebro" de la aplicación)
│   ├── models/            ➔ Aquí definiremos todas las Interfaces TypeScript (.interface.ts). Ej: Usuario, Mesa, Comanda, Producto. Garantiza que NO haya errores de estructura de datos.
│   └── services/          ➔ Los "Singleton". Aquí irán los servicios globales que se comunican con Firebase u otros datos. Ej: AuthService (login), OrderService (guardar pedido en BD). Nunca tienen interfaz gráfica.
│
├── 🧩 shared/             (La "Caja de Herramientas" reutilizable)
│   └── components/        ➔ Interfaz genérica que se usa en múltiples partes. Ej: Menú Lateral (Sidebar), Header principal, un popup personalizado para los Alérgenos, un botón dinámico, spinners de carga, etc.
│
├── 🚀 features/           (Las "Páginas o Vistas" principales, separadas por dominio)
│   ├── auth/              ➔ Vista de Login. Lógica de formularios para autenticar camareros o administrador.
│   ├── menu/              ➔ Pantallas del catálogo de comida (bebidas, entrantes). Aquí residirá el algoritmo clave de filtrado de alérgenos.
│   ├── orders/            ➔ La pantalla principal donde el camarero ve el "carrito" de la comanda, modifica cantidades y le da a "Enviar a Cocina".
│   └── tables/            ➔ Vista con el mapa o grilla de mesas del restaurante para marcar ocupación, mesas libres, o acceder a la cuenta de una de ellas.
│
├── 🏠 home/               ➔ La portada por defecto/Dashboard rápido después del login (la mantuvimos porque viene por defecto en Ionic, pero más adelante se transformará en el Dashboard).
│
├── 📄 app.component.ts    ➔ El cascarón madre de toda la App.
└── 🚦 app.routes.ts       ➔ El "Semáforo" / Gestor de Tráfico principal que redirige de una Feature a otra (Ej: de `/features/auth` a `/features/tables`).
