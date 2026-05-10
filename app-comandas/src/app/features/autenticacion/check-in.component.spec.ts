import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { CheckInComponent } from './check-in.component';
import { UsuarioService } from '../../core/services/usuario.service';
import { MesaAccessValidatorService } from '../../core/services/mesa-access-validator.service';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { TranslateService } from '@ngx-translate/core';

describe('CheckInComponent', () => {
  const routerMock = { navigate: jasmine.createSpy('navigate') };
  const usuarioServiceMock = {
    estaAutenticado: jasmine.createSpy('estaAutenticado').and.returnValue(false),
    establecerPerfil: jasmine.createSpy('establecerPerfil')
  };
  const mesaValidatorMock = {
    isValidMesaAccess: jasmine.createSpy('isValidMesaAccess').and.returnValue(true)
  };
  const settingsMock = { toggleDark: jasmine.createSpy('toggleDark'), isDark: jasmine.createSpy('isDark') };
  const translateMock = { instant: (clave: string) => clave };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckInComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: UsuarioService, useValue: usuarioServiceMock },
        { provide: MesaAccessValidatorService, useValue: mesaValidatorMock },
        { provide: UserSettingsService, useValue: settingsMock },
        { provide: TranslateService, useValue: translateMock },
        { provide: Auth, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } }
        }
      ]
    }).compileComponents();
  });

  it('debe marcar errores cuando el formulario es inválido', async () => {
    const fixture = TestBed.createComponent(CheckInComponent);
    const component = fixture.componentInstance;

    await component.acceder();

    expect(component.formulario.invalid).toBeTrue();
    expect(component.formulario.get('nombre')?.touched).toBeTrue();
    expect(component.formulario.get('mesaId')?.touched).toBeTrue();
  });

  it('debe deshabilitar mesa cuando llega por QR', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [CheckInComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: UsuarioService, useValue: usuarioServiceMock },
        { provide: MesaAccessValidatorService, useValue: mesaValidatorMock },
        { provide: UserSettingsService, useValue: settingsMock },
        { provide: TranslateService, useValue: translateMock },
        { provide: Auth, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => '7' } } }
        }
      ]
    });
    const fixture = TestBed.createComponent(CheckInComponent);
    const component = fixture.componentInstance;

    expect(component.mesaDesdeQR).toBeTrue();
    expect(component.formulario.get('mesaId')?.disabled).toBeTrue();
  });
});
