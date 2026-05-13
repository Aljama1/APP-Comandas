# Documentación Backend — Firebase Firestore

Este documento detalla la infraestructura cloud que soporta la aplicación **Trace**.

> 📐 **Diagramas asociados.** El modelo Entidad-Relación lógico de las cinco colecciones descritas a continuación, así como el diagrama de secuencia de la emisión de factura Veri\*factu con `runTransaction`, están disponibles en el anexo [`diagramas.md`](diagramas.md).

## 1. Configuración del Proyecto
- **ID del Proyecto**: `trace-6a41a`
- **Región**: `europe-west1` (Bélgica)
- **Plataforma**: Firebase (BaaS)

## 2. Autenticación (Firebase Auth)
Se ha implementado una estrategia híbrida:
- **Clientes (B2C)**: Autenticación Anónima. Permite identificar de forma única cada sesión de usuario (UID) sin añadir fricción en el proceso de pedido.
- **Administración (B2B)**: Email y Contraseña. El proveedor de inicio de sesión (`sign_in_provider`) se utiliza en las reglas de seguridad para diferenciar staff de cliente.

## 3. Modelo de Datos (Cloud Firestore)

### Colección: `comandas`
Cada documento representa un pedido enviado desde una mesa.

| Campo | Tipo | Descripción |
|---|---|---|
| `idCliente` | string | UID del usuario generado por Auth Anónimo |
| `nombreCliente` | string | Nombre introducido en el Check-in |
| `idMesa` | string | Identificador de la mesa física |
| `estado` | enum | PENDIENTE, PREPARANDO, SERVIDO, PAGADO, CANCELADO |
| `precioTotal` | number | Importe total de la orden |
| `fechaCreacion` | timestamp | Momento exacto del pedido (Server Timestamp) |
| `lineasComanda` | array | Lista de objetos que incluye: `idProducto`, `nombre`, `cantidad`, `notas` y `destino` (`BARRA` \| `COCINA`). Este último campo es crítico para el despacho inteligente de pedidos en el KDS. |
| `solicitaCuenta` | boolean | El cliente ha pulsado "Pedir la cuenta" desde el seguimiento. Se muestra como aviso en el panel del staff. |

### Colección: `productos`
Catálogo del restaurante. Lectura pública (para que el cliente cargue la carta sin autenticación previa) y escritura solo para staff. Soporta variantes de precio, modificadores y campo `stock` para auto-sold-out.

### Colección: `facturas` (módulo Veri\*factu — RD 1007/2023)
Documentos fiscales generados al cobrar una cuenta. **Append-only**: una vez emitida una factura, las reglas de Firestore prohíben modificarla o eliminarla. Cada factura incluye:
- `numero` correlativo dentro de la serie.
- `hashFactura` (SHA-256) sobre los campos críticos y el hash de la factura anterior, formando una cadena de integridad.
- Desglose de IVA por tipo impositivo.
- Referencia a la(s) comanda(s) origen y al UID del staff emisor.

### Colección: `metadatos`
Contiene el documento `contadores_facturas` con `serieActual` y `ultimoNumero`. Las reglas de Firestore obligan a que cualquier `update` incremente `ultimoNumero` exactamente en `+1` y mantenga `serieActual`, impidiendo rebobinar la numeración fiscal.

### Colección: `configuracion`
Documento `general` con parámetros de negocio (horario de turnos almuerzo/cena, idioma por defecto, datos del emisor para facturas, etc.). Lectura pública, escritura solo staff.

## 4. Arquitectura de Consultas (Consultas Múltiples)
A partir de la Fase 5, para dar soporte al modelo de "Rondas Múltiples" por mesa, el sistema utiliza una query activa en lugar de la escucha de un único documento:
- **Consulta**: Se buscan todos los documentos donde coincidan `idCliente` e `idMesa`, ordenados por `fechaCreacion`.
- **Índice Compuesto**: Firebase requiere un índice compuesto (`idCliente` ASC, `idMesa` ASC, `fechaCreacion` ASC) para ejecutar la suscripción en tiempo real (`onSnapshot`) de estas consultas complejas de manera eficiente.

## 5. Reglas de Seguridad (Producción)
Las reglas (`firestore.rules`) están blindadas y son las que se desplegarán en la defensa del TFG. Resumen:

- **Comandas**
  - `create`: staff sin restricciones; cliente anónimo solo si `idCliente == request.auth.uid`.
  - `read`: staff todo; cliente solo sus propias comandas.
  - `update`: staff todo; cliente solo si la comanda sigue en `PENDIENTE` y sin tocar `idCliente`, `idMesa`, `estado`, `precioTotal` ni `lineasComanda` (es decir, solo notas), **o** si únicamente cambia `solicitaCuenta` a `true`.
  - `delete`: exclusivo de staff.

- **Productos**: lectura pública (cliente sin login puede ver la carta); CRUD solo staff.

- **Facturas**: solo staff puede leer y crear. `update` y `delete` están **prohibidos a cualquier rol**, garantizando el principio append-only exigido por Veri\*factu.

- **Metadatos**: solo staff. El `update` está restringido a `ultimoNumero = previo + 1` y `serieActual` invariable. `delete` prohibido.

- **Configuración**: lectura pública, escritura staff.

- **Default deny**: cualquier ruta no contemplada se rechaza explícitamente.

Las reglas distinguen staff de cliente examinando `request.auth.token.firebase.sign_in_provider` (`anonymous` vs `password`).
