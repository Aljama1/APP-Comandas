# Checklist Maestro de QA

Guia de verificacion tecnica y de experiencia de usuario para la demo final del TFG.  
Objetivo: recorrer el flujo completo de extremo a extremo, detectando fallos funcionales, visuales y de sincronizacion antes de grabar.

## 1. Criterios Generales

- La app debe arrancar sin errores visibles en consola.
- No deben aparecer `console.log` de depuracion en el flujo normal.
- No deben verse textos rotos, placeholders tipo `test1`, `asdf` ni datos de prueba poco profesionales.
- La experiencia debe funcionar en desktop y en viewport movil.
- Los datos de la demo deben estar cargados en Firestore antes de empezar.
- No debe haber modales, drawers o overlays tapados por botones flotantes.

## 2. Datos Esperados En Firestore

Antes de grabar, verifica que existan estos conjuntos de datos:

- `productos`: carta completa con nombres descriptivos, imagen, categoria, precio, alergenos y disponibilidad.
- `comandas`: pedidos reales de la demo con estados coherentes.
- `facturas`: historico suficiente para mostrar cierre, trazabilidad y facturacion.
- `configuracion/general`: horarios y configuracion basica del restaurante.
- `metadatos/contadores_facturas`: contador inicializado para generar facturas sin error.

Evita estos patrones:

- nombres genericos tipo `test1`, `asdf`, `producto demo`.
- precios incoherentes o incompletos.
- imagenes rotas o vacias.
- alergenos sin traducir o en formato inconsistente.
- stock negativo o productos “agotados” sin reflejo en la carta.

## 3. Flujo Maestro Paso A Paso

### 3.1 Arranque de la app

- Abrir la app en una ventana limpia.
- Resultado esperado: pantalla inicial estable, sin errores visuales y con el tema correcto.
- Si la app arranca con service worker, confirmar que no bloquea la carga inicial.
- Revisar que la primera vista no muestre saltos de layout ni contenido desplazandose cuando cargan estilos o traducciones.

### 3.2 Escaneo Del QR

- Simular acceso desde QR con una mesa valida.
- Entrada: parametro de mesa en la URL o QR apuntando a una mesa existente.
- Resultado esperado: el formulario de check-in detecta la mesa y la bloquea visualmente.
- Verifica que el campo de mesa se muestre deshabilitado o solo lectura.
- Verifica que el indicador QR aparezca y que el texto no tenga caracteres rotos.
- Verifica que el numero de mesa coincida con la mesa real de la demo.

### 3.3 Check-In Del Cliente

- Introducir un nombre realista, por ejemplo `Laura Gomez`.
- Seleccionar alergias reales solo si quieres demostrar el filtrado.
- Resultado esperado: el usuario se identifica, se guarda el perfil y se navega a la carta.
- No debe aparecer ningun error de validacion si nombre y mesa son correctos.
- Si hay error de red, debe mostrarse el mensaje de conexion y no un fallo tecnico crudo.
- Verifica que el nombre quede legible en la tarjeta o resumen posterior.

### 3.4 Validaciones Anti-Fail Del Check-In

- Probar nombre vacio.
- Probar nombre con solo espacios.
- Probar nombre con caracteres extraños, por ejemplo `@@@@@@`, `123456`, `Laura<script>`.
- Probar nombre excesivamente largo para comprobar que no rompe la tarjeta ni el layout.
- Resultado esperado: el formulario rechaza entradas invalidas, mantiene mensajes de error claros y no deforma la interfaz.
- Verifica que el estado touched/error se vea sin necesidad de recargar.
- Verifica que los mensajes de error no tapen el resto del formulario en pantallas pequeñas.

### 3.5 Persistencia Y Recarga F5

- Entrar al flujo con una mesa valida y una sesion activa.
- En medio del proceso, refrescar la pagina con `F5`.
- Resultado esperado en cliente: la mesa y el contexto de sesion se mantienen o se reconstruyen segun el diseño de la app.
- Resultado esperado en cocina o admin: el panel vuelve al estado coherente, sin perder la comanda activa ni duplicarla.
- Si el carrito se resetea por diseno, debe quedar documentado y ser consistente; no puede perderse silenciosamente.
- Verifica que no se rompa la escucha en tiempo real al recargar.
- Verifica que no aparezcan duplicados tras refrescar.

### 3.6 Carta Del Cliente

- Revisar que la carta cargue con productos visibles y bien ordenados.
- Resultado esperado: cards o listado con imagen, precio, categoria y alergenos claros.
- Confirmar que los filtros de alergenos funcionan.
- Confirmar que los productos incompatibles con las alergias del cliente se ocultan o se marcan correctamente.
- Verificar que no aparezcan productos vacios, sin nombre o con imagen rota.
- Verificar que la disponibilidad se representa correctamente cuando un producto esta agotado.

### 3.7 Seleccion De Producto

- Añadir varios productos de distinta categoria.
- Añadir al menos una bebida para verificar la ruta de barra.
- Añadir una combinacion de items que genere una comanda visualmente interesante.
- Resultado esperado: el resumen flotante o panel de resumen muestra cantidades y total actualizado.
- Verificar que el total cambia al instante y que no hay desajustes entre lineas y total.
- Verificar que no aparezcan saltos de layout al abrir/cerrar el resumen.

### 3.8 Responsive Visual Check Del Carrito

- Probar la seleccion de productos en desktop y en viewport movil.
- Resultado esperado: el boton de `Enviar Comanda` no tapa contenido importante en movil.
- Verifica que el boton quede accesible sin ocultar lineas, totales ni notas.
- Verifica que, si existe menu lateral o drawer, se cierre tras pulsar fuera o tras navegar.
- Verifica que no haya solapamientos entre footer fijo, resumen flotante y contenido principal.

### 3.9 Resumen Y Envio

- Abrir el resumen de comanda.
- Revisar que nombre, mesa, lineas, notas y precio total sean correctos.
- Resultado esperado: boton de enviar activo solo cuando la comanda es valida.
- Enviar la comanda.
- Resultado esperado: mensaje de confirmacion y transicion a seguimiento o estado de pedido.
- Verificar que la comanda no se enviae dos veces si se pulsa repetidamente.

### 3.10 Recepcion En Panel De Administracion

- Cambiar a la vista de administrador o abrir el panel correspondiente.
- Resultado esperado: la nueva comanda aparece en `PENDIENTE`.
- Verificar que el panel muestre datos correctos de mesa, cliente, total y destino.
- Verificar que la tarjeta o fila nueva destaque visualmente.
- Si hay audio de notificacion, confirmar que suena una sola vez y no molesta.
- Verificar que no hay parpadeos o reordenaciones caoticas cuando entran varias comandas seguidas.

### 3.11 Vista De Cocina

- Abrir la vista de cocina.
- Resultado esperado: solo aparecen productos destinados a `COCINA`.
- Verificar que entrantes, principales, postres y especiales entren en esta vista.
- Verificar que el estado de la comanda cambia de `PENDIENTE` a `PREPARANDO` y luego a `LISTO`.
- Verificar que los productos ya preparados queden marcados visualmente.
- Verificar que los cambios aplicados aqui se reflejen en el cliente sin recarga.

### 3.12 Vista De Barra

- Abrir la vista de barra.
- Resultado esperado: solo aparecen bebidas.
- Verificar que la bebida no aparece en cocina y si en barra.
- Verificar que el cambio de estado en barra no rompe el orden del panel.
- Verificar que una bebida servida desaparece o se marca de forma coherente.

### 3.13 Sincronizacion En Tiempo Real

- Cambiar el estado de una comanda en cocina.
- Medir el tiempo hasta que el cambio impacta en cliente y administrador.
- Resultado esperado: el impacto debe ser casi inmediato y consistente.
- Anotar el tiempo objetivo de referencia:
- Cliente: idealmente instantaneo o en pocos segundos.
- Admin/Cocina/Barra: idealmente instantaneo o en pocos segundos.
- Verifica que no haya saltos visuales bruscos.
- Verifica que los skeletons, transiciones o loaders no muestren contenido viejo de forma intermitente.
- Verifica que no se vea la misma comanda duplicada durante la transicion.

### 3.14 Gestión De Inventario Y Stock

- Si la demo incluye stock por producto, agotar un producto desde el panel de admin.
- Resultado esperado: el producto desaparece de la carta o queda deshabilitado inmediatamente.
- Verifica que el cliente no pueda seguir añadiendolo al carrito.
- Verifica que el panel de admin refleje el estado de agotado sin inconsistencias.
- Si un producto agotado vuelve a reponerse, comprobar que reaparece correctamente.

### 3.15 Seguimiento Del Cliente

- Volver a la vista del cliente.
- Resultado esperado: el seguimiento muestra la comanda activa y su estado en tiempo real.
- Verificar que los cambios de cocina y barra se reflejen sin recargar la pagina.
- Revisar estados intermedios:
- `PENDIENTE`
- `PREPARANDO`
- `LISTO`
- `SERVIDO`
- Verificar que el stepper, barra de progreso o indicador visual no haga saltos extraños al cambiar de estado.

### 3.16 Cierre Y Pago

- Llevar la comanda al estado final previsto por la demo.
- Confirmar el cierre de mesa o la generacion de factura segun el flujo.
- Resultado esperado: la comanda desaparece del flujo activo y entra en historial o facturacion.
- Verificar que el cliente no queda con una mesa bloqueada.
- Verificar que el cierre no elimina historial necesario para el video o la demo.

### 3.17 Historial Y Facturacion

- Abrir historial de facturas.
- Resultado esperado: la factura nueva aparece con fecha, importe y numero coherente.
- Verificar integridad si se muestra hash o trazabilidad.
- Generar o revisar una factura de cierre si forma parte de la demo.
- Verificar que no aparezcan facturas duplicadas por una refrescada accidental.

### 3.18 Cierre Z Y Métricas

- Abrir el panel de metricas.
- Resultado esperado: KPIs cargados, ranking visible y sin estados vacios rotos.
- Exportar el cierre Z.
- Resultado esperado: PDF descargado con titulo, tabla y pie de pagina correctos.
- Verificar que no haya caracteres rotos en el PDF ni datos inventados.
- Verificar que el ranking no falle cuando hay pocos productos vendidos.

## 4. Revisión De Consola Y Network

- Abrir DevTools en la pestaña `Console`.
- Comprobar que no hay errores repetitivos ni logs de depuracion.
- Abrir la pestaña `Network`.
- Verificar que no hay 404 o 500 en bucle.
- Verificar que las llamadas a Firestore son razonables y no hay miles de lecturas por un ciclo infinito.
- Comprobar que no se reintenta la misma peticion de forma descontrolada.
- Si aparece una query compuesta, confirmar que el indice esta resuelto y no bloquea la demo.

## 5. Z-Index Y Limpieza Visual

- Abrir modales, popovers, drawers y resumen flotante.
- Verificar que ningun modal quede por debajo de botones flotantes o del carrito.
- Verificar que el overlay siempre cubre el contenido correcto.
- Verificar que el boton flotante no impida cerrar dialogos o aceptar acciones.
- Revisar que los componentes superpuestos mantengan un orden visual estable tanto en desktop como en movil.

## 6. Pruebas Rapidas De Resiliencia

- Probar nombre vacio en check-in.
- Probar nombre con caracteres raros o demasiado largo.
- Probar mesa invalida o no accesible.
- Probar carta sin productos para confirmar estado vacio elegante.
- Probar panel admin sin comandas activas.
- Probar una recarga F5 en cliente y en cocina.
- Probar desconexion de red y verificar mensaje controlado.

## 7. Checklist Final Antes De Grabar

- `npm run lint` en verde.
- `npm run build` en verde.
- Datos de demo cargados y verificados.
- Navegacion QR, carta, envio, cocina, barra y seguimiento probada al menos una vez.
- Persistencia F5 probada en cliente y panel.
- Sin logs de depuracion en la ruta principal.
- Sin textos corruptos ni placeholders visibles.
- PDF de cierre Z probado.
- Sonido de nueva comanda probado y con volumen razonable.
- Network tab limpia, sin bucles de 404/500.

## 8. Observaciones Sobre Datos De Demo

El repo no incluye un script de seeding dedicado. La demo depende de los documentos ya presentes en Firestore y de la carta cargada desde la coleccion `productos`.

Recomendacion de calidad:

- usar nombres de platos reales y coherentes con hosteleria.
- evitar valores genericos como `test1` o `asdf`.
- mantener imagenes consistentes y de buena resolucion.
- revisar que los alergenos esten normalizados en todos los documentos.
- mantener stock y disponibilidad coherentes con lo que se enseña en la grabacion.
