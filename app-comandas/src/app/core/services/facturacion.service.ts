import { Injectable, inject, NgZone, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import {
  Firestore, collection, doc, runTransaction
} from '@angular/fire/firestore';
import { FacturaLegal, ContadorFacturas, calcularDesgloseIva, generarHashFactura } from '../models/factura.model';
import { AdminComandaService } from './admin-comanda.service';
import { getTranslation } from '../models/common.model';

/**
 * Servicio especializado en la generación de facturas legales con encadenamiento VeriFactu.
 *
 * Responsabilidades:
 *  1. Calcular el total de consumición de una mesa
 *  2. Generar número de factura correlativo con serie
 *  3. Encadenar hashes SHA-256 para cumplir con VeriFactu
 *  4. Realizar transacción atómica (factura + contador)
 *  5. Marcar comandas como pagadas al finalizar
 *
 * Extrae la responsabilidad de facturación del AdminComandaService para mejorar:
 *  - Mantenibilidad: Lógica de facturación centralizada
 *  - Testabilidad: Fácil de unit-testear sin cargar AdminComandaService
 *  - Reusabilidad: Otro componente puede generar facturas sin conocer AdminComanda
 *
 * Nota: Mantiene alta cohesión con AdminComandaService (necesita acceso a _comandasActivas)
 * y finalizarCuentaMesa() para completar el ciclo de cierre de mesa.
 */
@Injectable({
  providedIn: 'root'
})
export class FacturacionService {
  private firestore = inject(Firestore);
  private adminComandaService = inject(AdminComandaService);
  private zona = inject(NgZone);
  private inyector = inject(EnvironmentInjector);

  /**
   * Genera una factura legal para todas las comandas activas de una mesa.
   *
   * Proceso:
   *  1. Recolecta todas las comandas de la mesa
   *  2. Calcula total con desglose de IVA
   *  3. Lee el contador de facturas actual
   *  4. Genera número correlativo (formato: SERIE-000001)
   *  5. Encadena hash SHA-256 con factura anterior
   *  6. Persiste factura + actualiza contador en transacción atómica
   *  7. Marca todas las comandas de la mesa como PAGADO
   *
   * @param idMesa - ID de la mesa para la que se genera factura
   * @param metodoPago - Método usado (Efectivo, Tarjeta, etc.)
   * @returns FacturaLegal con número, hashes y detalles del consumo
   *
   * @throws Error si no hay consumiciones, contador no existe, o transacción falla
   */
  async generarFactura(idMesa: string, metodoPago: string): Promise<FacturaLegal> {
    const comandasDeMesa = this.adminComandaService.obtenerComandasPorMesa(idMesa);
    
    if (comandasDeMesa.length === 0) {
      throw new Error(`No hay consumiciones registradas para la mesa ${idMesa}`);
    }

    // Cálculo del total y productos
    const totalConIva = comandasDeMesa.reduce((suma, c) => suma + (c.precioTotal || 0), 0);
    const productos = comandasDeMesa
      .map((c) => c.lineasComanda)
      .reduce((acumulado, val) => acumulado.concat(val), []);

    // Desglose de IVA (actualmente 10%)
    const desglose = calcularDesgloseIva(totalConIva, 10);

    // Normalización de datos de productos para la factura
    const snapshotProductos = productos.map((p: any) => ({
      idProducto: p.idProducto,
      nombre: getTranslation(p.nombreProducto, 'es'),
      cantidad: p.cantidad,
      precioUnitario: p.precioUnitario,
      subtotal: p.subtotal
    }));

    // Referencias a documentos Firestore
    const refContador = doc(this.firestore, 'metadatos/contadores_facturas');
    const refNuevaFactura = doc(collection(this.firestore, 'facturas'));

    try {
      const facturaGenerada = await runInInjectionContext(this.inyector, () =>
        runTransaction(this.firestore, async (transaccion) => {
          // 1. Leer contador actual (DEBE ser el primer paso)
          const docContador = await transaccion.get(refContador);

          if (!docContador.exists()) {
            throw new Error(
              'Error crítico: Contador de facturas no existe. ' +
              'Crea el documento inicial en Firestore: metadatos/contadores_facturas'
            );
          }

          const datosContador = docContador.data() as ContadorFacturas;

          // 2. Incrementar contador y generar número de factura
          const nuevoNumero = datosContador.ultimoNumero + 1;
          const numeroFormateado = `${datosContador.serieActual}-${nuevoNumero.toString().padStart(6, '0')}`;
          const fechaExpedicion = Date.now();
          const hashAnterior = datosContador.ultimoHash;

          // 3. Generar hash encadenado (VeriFactu)
          const hashActual = await generarHashFactura(
            numeroFormateado,
            fechaExpedicion,
            totalConIva,
            hashAnterior
          );

          // 4. Construir documento FacturaLegal
          const facturaLegal: FacturaLegal = {
            id: refNuevaFactura.id,
            idMesa: idMesa,
            numeroFactura: numeroFormateado,
            fechaExpedicion: fechaExpedicion,
            baseImponible: desglose.baseImponible,
            cuotaIva: desglose.cuotaIva,
            porcentajeIva: 10,
            importeTotal: totalConIva,
            metodoPago: metodoPago,
            hashAnterior: hashAnterior,
            hashActual: hashActual,
            productos: snapshotProductos
          };

          // 5. Ejecutar escrituras dentro de transacción
          transaccion.set(refNuevaFactura, facturaLegal);
          transaccion.update(refContador, {
            ultimoNumero: nuevoNumero,
            ultimoHash: hashActual
          });

          // Retornar la factura generada
          return facturaLegal;
        })
      );

      // 6. Marcar todas las comandas de la mesa como PAGADO (fuera de transacción)
      await this.adminComandaService.finalizarCuentaMesa(idMesa);

      return facturaGenerada as FacturaLegal;

    } catch (error) {
      console.error(`Error al generar factura para mesa ${idMesa}:`, error);
      throw error;
    }
  }

  /**
   * Valida la integridad de una factura contra su hash anterior.
   *
   * @param factura - FacturaLegal a validar
   * @param hashAnteriorEsperado - Hash del documento anterior en la cadena
   * @returns true si el hashAnterior coincide, false en caso contrario
   *
   * Nota: No valida el hashActual (eso se hace durante generación).
   * Esta función es útil para auditoría o validación de integridad.
   */
  validarIntegridad(factura: FacturaLegal, hashAnteriorEsperado: string): boolean {
    return factura.hashAnterior === hashAnteriorEsperado;
  }
}
