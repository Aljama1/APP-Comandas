# QA Ejecucion Final (Acta de Cierre)

Fecha: ____/____/______  
Responsable: ____________________  
Version/commit probado: ____________________

## 1. Gate Tecnico (obligatorio)

- [ ] `npm run lint` en verde
- [ ] `npm run build` en verde
- [ ] Sin errores bloqueantes en consola al arrancar
- [ ] Sin `console.log` de depuracion visibles en flujo normal
- [ ] Sin placeholders (`test1`, `asdf`, etc.) en UI

Notas:

---

## 2. Flujo E2E (marcar PASS/FAIL + evidencia)

1. Arranque y QR
- [ ] PASS [ ] FAIL - Arranque estable
- [ ] PASS [ ] FAIL - Mesa detectada por QR y bloqueada en check-in

2. Check-in y validaciones
- [ ] PASS [ ] FAIL - Check-in valido (nombre real)
- [ ] PASS [ ] FAIL - Rechaza vacio/espacios
- [ ] PASS [ ] FAIL - Rechaza entradas raras (`@@@@`, `123`, `<script>`)
- [ ] PASS [ ] FAIL - No rompe layout en nombre largo

3. Carta y carrito
- [ ] PASS [ ] FAIL - Carta completa con imagen/precio/categoria/alergenos
- [ ] PASS [ ] FAIL - Filtros de alergenos correctos
- [ ] PASS [ ] FAIL - Carrito actualiza total y cantidades al instante
- [ ] PASS [ ] FAIL - Responsive movil sin solapamientos

4. Envio y paneles operativos
- [ ] PASS [ ] FAIL - Envio de comanda sin duplicados por doble click
- [ ] PASS [ ] FAIL - Admin recibe comanda en `PENDIENTE`
- [ ] PASS [ ] FAIL - Cocina ve solo productos de cocina
- [ ] PASS [ ] FAIL - Barra ve solo bebidas

5. Estados y sincronizacion
- [ ] PASS [ ] FAIL - Transicion `PENDIENTE -> PREPARANDO -> LISTO -> SERVIDO`
- [ ] PASS [ ] FAIL - Cliente/admin/cocina/barra sincronizan en tiempo real
- [ ] PASS [ ] FAIL - Recarga `F5` no rompe estado ni duplica

6. Cierre y facturacion
- [ ] PASS [ ] FAIL - Cierre de mesa correcto
- [ ] PASS [ ] FAIL - Factura creada sin duplicados
- [ ] PASS [ ] FAIL - Historial y trazabilidad visibles
- [ ] PASS [ ] FAIL - Exportacion de cierre Z (PDF) correcta

Evidencias (capturas/video/ids de comanda/factura):

---

## 3. Incidencias encontradas

Formato sugerido por incidencia:
- ID:
- Severidad: Critica / Alta / Media / Baja
- Paso:
- Resultado actual:
- Resultado esperado:
- Evidencia:
- Estado: Abierta / Corregida / Re-test OK

---

## 4. Criterio de salida para grabacion

Se puede grabar solo si:
- [ ] No hay incidencias Criticas
- [ ] No hay incidencias Altas sin workaround aceptable
- [ ] Flujo maestro completo en PASS
- [ ] Datos demo revisados en Firestore

Decision final:
- [ ] GO (lista para grabar)
- [ ] NO GO (faltan correcciones)

