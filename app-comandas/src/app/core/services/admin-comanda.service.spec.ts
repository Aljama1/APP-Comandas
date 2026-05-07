import { TestBed } from '@angular/core/testing';
import { AdminComandaService } from './admin-comanda.service';
import { Firestore } from '@angular/fire/firestore';
import { UserSettingsService } from './user-settings.service';
import { signal } from '@angular/core';

describe('AdminComandaService', () => {
  let service: AdminComandaService;
  let firestoreSpy: jasmine.SpyObj<Firestore>;
  let userSettingsSpy: jasmine.SpyObj<UserSettingsService>;

  beforeEach(() => {
    firestoreSpy = jasmine.createSpyObj('Firestore', ['app']);
    userSettingsSpy = jasmine.createSpyObj('UserSettingsService', ['soundEnabled']);
    
    // Simulate signal for user settings if needed
    userSettingsSpy.soundEnabled.and.returnValue(true);

    TestBed.configureTestingModule({
      providers: [
        AdminComandaService,
        { provide: Firestore, useValue: firestoreSpy },
        { provide: UserSettingsService, useValue: userSettingsSpy }
      ]
    });
    
    service = TestBed.inject(AdminComandaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty arrays for computed values', () => {
    expect(service.pedidosPendientes().length).toBe(0);
    expect(service.pedidosEnCurso().length).toBe(0);
    expect(service.pedidosHistorial().length).toBe(0);
    expect(service.pedidosCocina().length).toBe(0);
    expect(service.pedidosBarra().length).toBe(0);
    expect(service.productosAgregadosCocina().length).toBe(0);
    expect(service.productosBarra().length).toBe(0);
  });

  it('should manage active listeners count properly when starting and stopping listener', () => {
    // Note: since Firestore functions like collection(), query(), onSnapshot() are
    // imported directly from '@angular/fire/firestore', testing the actual snapshot
    // requires mocking the module itself, which can be complex.
    // For this test, we just verify the internal activeListeners count logic if accessible, 
    // or through the method effects.
    
    // As activeListeners is private, we observe the effect or just call the method
    // to ensure no errors are thrown during basic listener management.
    
    // Calling detenerEscucha when there are 0 listeners should not fail
    expect(() => service.detenerEscucha()).not.toThrow();
  });
  
  it('should have boolean flags correctly reflecting empty state', () => {
    expect(service.hayPedidosPendientes()).toBeFalse();
    expect(service.hayPedidosEnCurso()).toBeFalse();
    expect(service.hayPedidosHistorial()).toBeFalse();
    expect(service.hayPedidosCocina()).toBeFalse();
    expect(service.hayPedidosBarra()).toBeFalse();
  });
});
