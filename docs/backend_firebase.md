# Documentación Backend — Firebase Firestore

Este documento detalla la infraestructura cloud que soporta la aplicación **Trace**.

## 1. Configuración del Proyecto
- **ID del Proyecto**: `trace-6a41a`
- **Región**: `europe-west1` (Bélgica)
- **Plataforma**: Firebase (BaaS)

## 2. Autenticación (Firebase Auth)
Se ha implementado una estrategia híbrida:
- **Clientes (B2C)**: Autenticación Anónima. Permite identificar de forma única cada sesión de usuario (UID) sin añadir fricción en el proceso de pedido.
- **Administración (B2B)**: Email y Contraseña (configurado para futuras fases).

## 3. Modelo de Datos (Cloud Firestore)

### Colección: `comandas`
Cada documento representa un pedido enviado desde una mesa.

| Campo | Tipo | Descripción |
|---|---|---|
| `idCliente` | string | UID del usuario generado por Auth Anónimo |
| `nombreCliente` | string | Nombre introducido en el Check-in |
| `idMesa` | string | Identificador de la mesa física |
| `estado` | enum | PENDIENTE, PREPARANDO, LISTO, SERVIDO, PAGADO |
| `precioTotal` | number | Importe total de la orden |
| `fechaCreacion` | timestamp | Momento exacto del pedido (Server Timestamp) |
| `lineasComanda` | array | Lista de objetos (idProducto, nombre, cantidad, notas, destino: BARRA/COCINA) |

## 4. Arquitectura de Consultas (Consultas Múltiples)
A partir de la Fase 5, para dar soporte al modelo de "Rondas Múltiples" por mesa, el sistema ha abandonado la escucha de un único documento para utilizar una query activa:
- **Consulta**: Se buscan todos los documentos donde coincidan `idCliente` e `idMesa`, ordenados por `fechaCreacion`.
- **Índice Compuesto**: Firebase requiere un índice compuesto (`idCliente` ASC, `idMesa` ASC, `fechaCreacion` ASC) para ejecutar la suscripción en tiempo real (`onSnapshot`) de estas consultas complejas de manera eficiente.
## 5. Reglas de Seguridad (Modo Desarrollo)
Actualmente el proyecto opera en **"Modo de prueba"**, lo que permite lectura y escritura abierta para agilizar el desarrollo de los prototipos iniciales. Antes de la entrega final, se restringirán las reglas para que:
- Solo los administradores lean todas las comandas.
- Los clientes solo puedan escribir sus propias comandas.
