import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { AdminComandaService } from './admin-comanda.service';
import { FacturacionService } from './facturacion.service';
import { Comanda } from '../models/comanda.model';
import { FacturaLegal } from '../models/factura.model';

describe('FacturacionService', () => {
  let servicio: FacturacionService;
  let servicioAdmin: jasmine.SpyObj<AdminComandaService>;
  let firestore: Firestore;

  beforeEach(() => {
    const adminSpy = jasmine.createSpyObj<AdminComandaService>('AdminComandaService', [
      'obtenerComandasPorMesa'
    ]);

    TestBed.configureTestingModule({
      providers: [
        FacturacionService,
        { provide: AdminComandaService, useValue: adminSpy },
        { provide: Firestore, useValue: {} }
      ]
    });

    servicio = TestBed.inject(FacturacionService);
    servicioAdmin = TestBed.inject(AdminComandaService) as jasmine.SpyObj<AdminComandaService>;
    firestore = TestBed.inject(Firestore);
  });

  it('deberia crearse', () => {
    expect(servicio).toBeTruthy();
  });

  it('deberia lanzar error si no hay consumiciones para la mesa', async () => {
    servicioAdmin.obtenerComandasPorMesa.and.returnValue([]);

    await expectAsync(servicio.generarFactura('mesa-1', 'Efectivo'))
      .toBeRejectedWithError(/No hay consumiciones/);
  });

  it('deberia calcular total de comandas de una mesa en el mock', () => {
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
      ...comanda1,
      estado: 'PREPARANDO',
      precioTotal: 20
    };
    servicioAdmin.obtenerComandasPorMesa.and.returnValue([comanda1, comanda2]);

    const comandas = servicioAdmin.obtenerComandasPorMesa('mesa-5');
    const total = comandas.reduce((acumulado, item) => acumulado + item.precioTotal, 0);
    expect(comandas.length).toBe(2);
    expect(total).toBe(50);
  });

  it('deberia validar integridad positiva', () => {
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

    expect(servicio.validarIntegridad(factura, 'hash-anterior-123')).toBeTrue();
  });

  it('deberia validar integridad negativa', () => {
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

    expect(servicio.validarIntegridad(factura, 'hash-distinto')).toBeFalse();
  });

  it('deberia inyectar dependencias', () => {
    expect(servicioAdmin).toBeDefined();
    expect(firestore).toBeDefined();
  });
});


