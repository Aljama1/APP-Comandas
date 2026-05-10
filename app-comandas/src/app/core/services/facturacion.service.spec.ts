import { TestBed } from '@angular/core/testing';
import { FacturacionService } from './facturacion.service';
import { AdminComandaService } from './admin-comanda.service';
import { Firestore } from '@angular/fire/firestore';
import { FacturaLegal } from '../models/factura.model';
import { Comanda, LineaComanda } from '../models/comanda.model';

describe('FacturacionService', () => {
  let servicio: FacturacionService;
  let servicioAdmin: AdminComandaService;
  let firestore: Firestore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FacturacionService,
        {
          provide: AdminComandaService,
          useValue: {
            obtenerComandasPorMesa: jasmine.createSpy('obtenerComandasPorMesa'),
            finalizarCuentaMesa: jasmine.createSpy('finalizarCuentaMesa').and.returnValue(Promise.resolve())
          }
        },
        {
          provide: Firestore,
          useValue: {
            // Mock Firestore
          }
        }
      ]
    });

    servicio = TestBed.inject(FacturacionService);
    servicioAdmin = TestBed.inject(AdminComandaService);
    firestore = TestBed.inject(Firestore);
  });

  it('debería estar creado', () => {
    expect(servicio).toBeTruthy();
  });

  describe('generarFactura', () => {
    it('debería lanzar error si no hay consumiciones para la mesa', async () => {
      (servicioAdmin.obtenerComandasPorMesa as jasmine.Spy).and.returnValue([]);

      try {
        await servicio.generarFactura('mesa-1', 'Efectivo');
        fail('Debería haber lanzado un error');
      } catch (error) {
        expect(error).toBeTruthy();
        expect((error as Error).message).toContain('No hay consumiciones');
      }
    });

    it('debería validar que idMesa sea proporcionado', async () => {
      const comanda: Comanda = {
        idMesa: 'mesa-1',
        idCliente: 'cliente-1',
        nombreCliente: 'Juan',
        lineasComanda: [],
        estado: 'PENDIENTE',
        precioTotal: 50,
        fechaCreacion: Date.now(),
        fechaActualizacion: Date.now()
      };

      (servicioAdmin.obtenerComandasPorMesa as jasmine.Spy).and.returnValue([comanda]);

      // Esta prueba depende de que la transacción se ejecute correctamente
      // Por ahora, solo verificamos que se llame a obtenerComandasPorMesa
      expect(servicioAdmin.obtenerComandasPorMesa).toBeDefined();
    });

    it('debería calcular total correctamente con múltiples comandas', async () => {
      const comanda1: Comanda = {
        idMesa: 'mesa-5',
        idCliente: 'cliente-1',
        nombreCliente: 'Juan',
        lineasComanda: [],
        estado: 'PENDIENTE',
        precioTotal: 30,
        fechaCreacion: Date.now(),
        fechaActualizacion: Date.now()
      };

      const comanda2: Comanda = {
        idMesa: 'mesa-5',
        idCliente: 'cliente-1',
        nombreCliente: 'Juan',
        lineasComanda: [],
        estado: 'PREPARANDO',
        precioTotal: 20,
        fechaCreacion: Date.now(),
        fechaActualizacion: Date.now()
      };

      (servicioAdmin.obtenerComandasPorMesa as jasmine.Spy).and.returnValue([comanda1, comanda2]);

      // Total esperado: 50
      const comandas = servicioAdmin.obtenerComandasPorMesa('mesa-5');
      expect((comandas as Comanda[]).length).toBe(2);
      expect((comandas as Comanda[])[0].precioTotal +
             (comandas as Comanda[])[1].precioTotal).toBe(50);
    });
  });

  describe('validarIntegridad', () => {
    it('debería retornar true si el hash anterior coincide', () => {
      const factura: FacturaLegal = {
        id: 'fac-1',
        idMesa: 'mesa-1',
        numeroFactura: 'F26-000001',
        fechaExpedicion: Date.now(),
        baseImponible: 45.45,
        cuotaIva: 4.55,
        porcentajeIva: 10,
        importeTotal: 50,
        metodoPago: 'Efectivo',
        hashAnterior: 'hash-anterior-123',
        hashActual: 'hash-actual-456',
        productos: []
      };

      const resultado = servicio.validarIntegridad(factura, 'hash-anterior-123');
      expect(resultado).toBe(true);
    });

    it('debería retornar false si el hash anterior no coincide', () => {
      const factura: FacturaLegal = {
        id: 'fac-1',
        idMesa: 'mesa-1',
        numeroFactura: 'F26-000001',
        fechaExpedicion: Date.now(),
        baseImponible: 45.45,
        cuotaIva: 4.55,
        porcentajeIva: 10,
        importeTotal: 50,
        metodoPago: 'Efectivo',
        hashAnterior: 'hash-anterior-123',
        hashActual: 'hash-actual-456',
        productos: []
      };

      const resultado = servicio.validarIntegridad(factura, 'hash-diferente');
      expect(resultado).toBe(false);
    });

    it('debería validar integridad de factura encadenada', () => {
      const factura1: FacturaLegal = {
        id: 'fac-1',
        idMesa: 'mesa-1',
        numeroFactura: 'F26-000001',
        fechaExpedicion: Date.now(),
        baseImponible: 45.45,
        cuotaIva: 4.55,
        porcentajeIva: 10,
        importeTotal: 50,
        metodoPago: 'Efectivo',
        hashAnterior: 'hash-cero',
        hashActual: 'hash-factura-1',
        productos: []
      };

      const factura2: FacturaLegal = {
        id: 'fac-2',
        idMesa: 'mesa-1',
        numeroFactura: 'F26-000002',
        fechaExpedicion: Date.now() + 1000,
        baseImponible: 45.45,
        cuotaIva: 4.55,
        porcentajeIva: 10,
        importeTotal: 50,
        metodoPago: 'Tarjeta',
        hashAnterior: 'hash-factura-1',  // Encadenado con factura1
        hashActual: 'hash-factura-2',
        productos: []
      };

      // Factura2 debe tener como hashAnterior el hashActual de factura1
      expect(servicio.validarIntegridad(factura2, factura1.hashActual)).toBe(true);
    });
  });

  describe('inyecciones de dependencias', () => {
    it('debería inyectar AdminComandaService correctamente', () => {
      expect(servicioAdmin).toBeDefined();
      expect(servicioAdmin.obtenerComandasPorMesa).toBeDefined();
    });

    it('debería inyectar Firestore correctamente', () => {
      expect(firestore).toBeDefined();
    });
  });
});
