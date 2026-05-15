import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { TranslateService } from '@ngx-translate/core';
import { CheckInComponent } from './check-in.component';
import { UsuarioService } from '../../core/services/usuario.service';
import { MesaAccessValidatorService } from '../../core/services/mesa-access-validator.service';
import { UserSettingsService } from '../../core/services/user-settings.service';

describe('CheckInComponent', () => {
  let routerMock: jasmine.SpyObj<Router>;
  let usuarioServiceMock: jasmine.SpyObj<UsuarioService>;
  let mesaValidatorMock: jasmine.SpyObj<MesaAccessValidatorService>;
  let settingsMock: Pick<UserSettingsService, 'toggleDark' | 'isDark'>;
  let translateMock: Pick<TranslateService, 'instant'>;

  beforeEach(async () => {
    routerMock = jasmine.createSpyObj<Router>('Router', ['navigate']);
    usuarioServiceMock = jasmine.createSpyObj<UsuarioService>('UsuarioService', ['estaAutenticado', 'establecerPerfil']);
    mesaValidatorMock = jasmine.createSpyObj<MesaAccessValidatorService>('MesaAccessValidatorService', ['isValidMesaAccess']);
    usuarioServiceMock.estaAutenticado.and.returnValue(false);
    mesaValidatorMock.isValidMesaAccess.and.returnValue(true);
    settingsMock = { toggleDark: jasmine.createSpy('toggleDark'), isDark: jasmine.createSpy('isDark') as any };
    translateMock = { instant: (clave: string) => clave };

    await TestBed.configureTestingModule({
      imports: [CheckInComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: UsuarioService, useValue: usuarioServiceMock },
        { provide: MesaAccessValidatorService, useValue: mesaValidatorMock },
        { provide: UserSettingsService, useValue: settingsMock },
        { provide: TranslateService, useValue: translateMock },
        { provide: Auth, useValue: {} },
        { provide: Firestore, useValue: {} },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } }
      ]
    }).compileComponents();
  });

  it('debe marcar controles como touched cuando el formulario es inválido', async () => {
    const fixture = TestBed.createComponent(CheckInComponent);
    const component = fixture.componentInstance;

    await component.acceder();

    expect(component.formulario.invalid).toBeTrue();
    expect(component.formulario.get('nombre')?.touched).toBeTrue();
    expect(component.formulario.get('mesaId')?.touched).toBeTrue();
  });

  it('debe deshabilitar mesa cuando llega por QR', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CheckInComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: UsuarioService, useValue: usuarioServiceMock },
        { provide: MesaAccessValidatorService, useValue: mesaValidatorMock },
        { provide: UserSettingsService, useValue: settingsMock },
        { provide: TranslateService, useValue: translateMock },
        { provide: Auth, useValue: {} },
        { provide: Firestore, useValue: {} },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => '7' } } } }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(CheckInComponent);
    const component = fixture.componentInstance;

    expect(component.mesaDesdeQR).toBeTrue();
    expect(component.formulario.get('mesaId')?.disabled).toBeTrue();
  });
});
