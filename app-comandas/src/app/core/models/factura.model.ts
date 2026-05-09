export interface FacturaLegal {
  id?: string;                 // Autogenerado por Firestore
  idMesa: string;
  numeroFactura: string;       // Ej: "F26-000146" (Serie + Número)
  fechaExpedicion: number;     // Timestamp exacto
  
  // Totales y Desglose
  baseImponible: number;       // Sin IVA
  cuotaIva: number;            // Solo el 10% de IVA
  porcentajeIva: number;       // 10 (Constante por ahora)
  importeTotal: number;        // Base + Cuota
  
  metodoPago: string;          // 'EFECTIVO' | 'TARJETA' | 'OTROS'
  
  // Trazabilidad y Veri*factu
  hashAnterior: string;        // Hash de la factura anterior
  hashActual: string;          // Hash SHA-256 (Numero + Fecha + Total + HashAnterior)
  
  // Snapshots (Para inalterabilidad)
  productos: any[];            // Copia inmutable de los productos
}

export interface ContadorFacturas {
  serieActual: string;         // Ej: "F26"
  ultimoNumero: number;        // Ej: 145
  ultimoHash: string;          // Hash de la última factura
}

/**
 * Función de utilidad para calcular el desglose de IVA.
 * Asume que el precio de los productos de la comanda ya tiene el IVA INCLUIDO.
 * @param totalConIva El precio total a pagar por el cliente.
 * @param porcentajeIva El porcentaje a aplicar (ej. 10 para hostelería).
 * @returns Objeto con baseImponible y cuotaIva redondeados a 2 decimales.
 */
export function calcularDesgloseIva(totalConIva: number, porcentajeIva: number = 10): { baseImponible: number, cuotaIva: number } {
  // Fórmula: Base = Total / (1 + (IVA/100))
  const divisor = 1 + (porcentajeIva / 100);
  const base = totalConIva / divisor;
  const cuota = totalConIva - base;
  
  return {
    baseImponible: Number(base.toFixed(2)),
    cuotaIva: Number(cuota.toFixed(2))
  };
}

/**
 * Genera un Hash SHA-256 para la factura actual.
 * @param texto Cadena concatenada con los datos de la factura
 * @returns Promise<string> con el hash en formato hexadecimal
 */
export async function generarHashFactura(numeroFactura: string, fecha: number, total: number, hashAnterior: string): Promise<string> {
  const encadenamiento = `${numeroFactura}|${fecha}|${total.toFixed(2)}|${hashAnterior}`;
  
  // Usamos Web Crypto API (Nativo del navegador)
  const encoder = new TextEncoder();
  const data = encoder.encode(encadenamiento);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}
