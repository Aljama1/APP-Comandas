import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Auth, signInAnonymously } from '@angular/fire/auth';
import { UsuarioService } from '../../core/services/usuario.service';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { PerfilUsuario } from '../../core/models/perfil-usuario.model';
import { TranslateModule } from '@ngx-translate/core';
import { Alergeno } from '../../core/models/producto.model';

@Component({
  selector: 'app-check-in',
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './check-in.component.html',
  styleUrls: ['./check-in.component.scss']
})
export class CheckInComponent implements OnInit {
  mesaDesdeQR = false;

  todosLosAlergenos: { id: Alergeno; nombre: string; emoji: string }[] = [
    { id: 'Gluten', nombre: 'ALERGENOS.gluten', emoji: '🌾' },
    { id: 'Crustáceos', nombre: 'ALERGENOS.crustaceos', emoji: '🦞' },
    { id: 'Huevos', nombre: 'ALERGENOS.huevo', emoji: '🥚' },
    { id: 'Pescado', nombre: 'ALERGENOS.pescado', emoji: '🐟' },
    { id: 'Cacahuetes', nombre: 'ALERGENOS.cacahuetes', emoji: '🥜' },
    { id: 'Soja', nombre: 'ALERGENOS.soja', emoji: '🫘' },
    { id: 'Lácteos', nombre: 'ALERGENOS.lactosa', emoji: '🥛' },
    { id: 'Frutos de cáscara', nombre: 'ALERGENOS.frutos-secos', emoji: '🌰' },
    { id: 'Apio', nombre: 'ALERGENOS.apio', emoji: '🥬' },
    { id: 'Mostaza', nombre: 'ALERGENOS.mostaza', emoji: '🌭' },
    { id: 'Granos de sésamo', nombre: 'ALERGENOS.sesamo', emoji: '🥯' },
    { id: 'Dióxido de azufre y sulfitos', nombre: 'ALERGENOS.sulfitos', emoji: '🍷' },
    { id: 'Altramuces', nombre: 'ALERGENOS.altramuces', emoji: '🌼' },
    { id: 'Moluscos', nombre: 'ALERGENOS.moluscos', emoji: '🦪' }
  ];

  private router = inject(Router);
  private usuarioService = inject(UsuarioService);
  public settings = inject(UserSettingsService);
  private auth = inject(Auth);
  private route = inject(ActivatedRoute);
  private formBuilder = inject(FormBuilder);

  formulario = this.formBuilder.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    mesaId: [null as number | null, [Validators.required, Validators.min(1)]],
    alergenosSeleccionados: [[] as Alergeno[]]
  });

  constructor() {
    const mesa = this.route.snapshot.queryParamMap.get('mesa');
    const mesaNum = Number(mesa);
    if (mesa && Number.isInteger(mesaNum) && mesaNum >= 1) {
      this.formulario.patchValue({ mesaId: mesaNum });
      this.mesaDesdeQR = true;
      this.formulario.get('mesaId')?.disable();
    }
  }

  ngOnInit(): void {
    if (this.usuarioService.estaAutenticado()) {
      this.router.navigate(['/carta']);
    }
  }

  mostrarErrorNombre(): boolean {
    const control = this.formulario.get('nombre');
    return !!control && control.invalid && control.touched;
  }

  mostrarErrorMesa(): boolean {
    const control = this.formulario.get('mesaId');
    return !!control && control.invalid && control.touched;
  }

  async acceder() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    const nombre = (valores.nombre ?? '').trim();
    const mesaId = valores.mesaId;
    const alergenosSeleccionados = valores.alergenosSeleccionados ?? [];

    try {
      // Reutilizamos el usuario anónimo existente si Firebase ya lo tiene
      // en sesión. Crear uno nuevo en cada check-in dejaría huérfanas las
      // comandas previas (la regla idCliente == uid dejaría de coincidir).
      const usuarioActual = this.auth.currentUser;
      const usuario = usuarioActual?.isAnonymous
        ? usuarioActual
        : (await signInAnonymously(this.auth)).user;
      const uid = usuario.uid;

      const nuevoPerfil: PerfilUsuario = {
        uid,
        nombre,
        mesaId: mesaId!,
        alergenos: alergenosSeleccionados
      };

      this.usuarioService.establecerPerfil(nuevoPerfil);
      this.router.navigate(['/carta']);
    } catch {
      this.formulario.get('nombre')?.setErrors({ conexion: true });
      this.formulario.get('nombre')?.markAsTouched();
    }
  }
}
