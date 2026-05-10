import { TestBed } from '@angular/core/testing';
import { MesaAccessValidatorService } from './mesa-access-validator.service';
import { UsuarioService } from './usuario.service';
import { PerfilUsuario } from '../models/perfil-usuario.model';

describe('MesaAccessValidatorService', () => {
  let service: MesaAccessValidatorService;
  let usuarioService: UsuarioService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MesaAccessValidatorService, UsuarioService]
    });
    service = TestBed.inject(MesaAccessValidatorService);
    usuarioService = TestBed.inject(UsuarioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isValidMesaAccess', () => {
    it('should return false if user is not authenticated', () => {
      usuarioService.limpiarPerfil();
      expect(service.isValidMesaAccess('any-uid', 5)).toBe(false);
    });

    it('should return false if uid parameter is empty', () => {
      const perfil: PerfilUsuario = {
        uid: 'user-123',
        nombre: 'Juan',
        mesaId: 5,
        alergenos: []
      };
      usuarioService.establecerPerfil(perfil);
      expect(service.isValidMesaAccess('', 5)).toBe(false);
    });

    it('should return false if mesaId is null in profile', () => {
      const perfil: PerfilUsuario = {
        uid: 'user-123',
        nombre: 'Juan',
        mesaId: null,
        alergenos: []
      };
      usuarioService.establecerPerfil(perfil);
      expect(service.isValidMesaAccess('user-123', 5)).toBe(false);
    });

    it('should return false if mesaId does not match', () => {
      const perfil: PerfilUsuario = {
        uid: 'user-123',
        nombre: 'Juan',
        mesaId: 5,
        alergenos: []
      };
      usuarioService.establecerPerfil(perfil);
      // Trying to access mesa 7 instead of 5
      expect(service.isValidMesaAccess('user-123', 7)).toBe(false);
    });

    it('should return false if uid does not match', () => {
      const perfil: PerfilUsuario = {
        uid: 'user-123',
        nombre: 'Juan',
        mesaId: 5,
        alergenos: []
      };
      usuarioService.establecerPerfil(perfil);
      // Trying to access with different uid
      expect(service.isValidMesaAccess('user-456', 5)).toBe(false);
    });

    it('should return true if uid and mesaId match', () => {
      const perfil: PerfilUsuario = {
        uid: 'user-123',
        nombre: 'Juan',
        mesaId: 5,
        alergenos: []
      };
      usuarioService.establecerPerfil(perfil);
      expect(service.isValidMesaAccess('user-123', 5)).toBe(true);
    });

    it('should return false if mesaId parameter is null', () => {
      const perfil: PerfilUsuario = {
        uid: 'user-123',
        nombre: 'Juan',
        mesaId: 5,
        alergenos: []
      };
      usuarioService.establecerPerfil(perfil);
      expect(service.isValidMesaAccess('user-123', null)).toBe(false);
    });

    it('should return false if uid is not authenticated (null profile)', () => {
      usuarioService.limpiarPerfil();
      expect(service.isValidMesaAccess('user-123', 5)).toBe(false);
    });
  });

  describe('getMesaIdFromProfile', () => {
    it('should return null if user is not authenticated', () => {
      usuarioService.limpiarPerfil();
      expect(service.getMesaIdFromProfile('any-uid')).toBeNull();
    });

    it('should return null if uid does not match profile uid', () => {
      const perfil: PerfilUsuario = {
        uid: 'user-123',
        nombre: 'Juan',
        mesaId: 5,
        alergenos: []
      };
      usuarioService.establecerPerfil(perfil);
      expect(service.getMesaIdFromProfile('user-456')).toBeNull();
    });

    it('should return mesaId if uid matches', () => {
      const perfil: PerfilUsuario = {
        uid: 'user-123',
        nombre: 'Juan',
        mesaId: 5,
        alergenos: []
      };
      usuarioService.establecerPerfil(perfil);
      expect(service.getMesaIdFromProfile('user-123')).toBe(5);
    });

    it('should return null if mesaId is null in profile', () => {
      const perfil: PerfilUsuario = {
        uid: 'user-123',
        nombre: 'Juan',
        mesaId: null,
        alergenos: []
      };
      usuarioService.establecerPerfil(perfil);
      expect(service.getMesaIdFromProfile('user-123')).toBeNull();
    });

    it('should return 0 if mesaId is 0 (valid edge case)', () => {
      const perfil: PerfilUsuario = {
        uid: 'user-123',
        nombre: 'Juan',
        mesaId: 0,
        alergenos: []
      };
      usuarioService.establecerPerfil(perfil);
      expect(service.getMesaIdFromProfile('user-123')).toBe(0);
    });
  });

  describe('detectaMesaIdChange', () => {
    it('should return false if user is not authenticated', () => {
      usuarioService.limpiarPerfil();
      expect(service.detectaMesaIdChange(5)).toBe(false);
    });

    it('should return false if profile has no mesaId', () => {
      const perfil: PerfilUsuario = {
        uid: 'user-123',
        nombre: 'Juan',
        mesaId: null,
        alergenos: []
      };
      usuarioService.establecerPerfil(perfil);
      expect(service.detectaMesaIdChange(5)).toBe(false);
    });

    it('should return true if new mesaId differs from profile mesaId', () => {
      const perfil: PerfilUsuario = {
        uid: 'user-123',
        nombre: 'Juan',
        mesaId: 5,
        alergenos: []
      };
      usuarioService.establecerPerfil(perfil);
      // Attempting to change from mesa 5 to mesa 7
      expect(service.detectaMesaIdChange(7)).toBe(true);
    });

    it('should return false if new mesaId matches profile mesaId', () => {
      const perfil: PerfilUsuario = {
        uid: 'user-123',
        nombre: 'Juan',
        mesaId: 5,
        alergenos: []
      };
      usuarioService.establecerPerfil(perfil);
      expect(service.detectaMesaIdChange(5)).toBe(false);
    });

    it('should return true if attempting to change to null', () => {
      const perfil: PerfilUsuario = {
        uid: 'user-123',
        nombre: 'Juan',
        mesaId: 5,
        alergenos: []
      };
      usuarioService.establecerPerfil(perfil);
      expect(service.detectaMesaIdChange(null)).toBe(true);
    });

    it('should handle zero as valid mesaId', () => {
      const perfil: PerfilUsuario = {
        uid: 'user-123',
        nombre: 'Juan',
        mesaId: 0,
        alergenos: []
      };
      usuarioService.establecerPerfil(perfil);
      expect(service.detectaMesaIdChange(0)).toBe(false);
      expect(service.detectaMesaIdChange(1)).toBe(true);
    });
  });
});
